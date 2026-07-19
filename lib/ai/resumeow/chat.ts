import { classifyResumeScope } from "@/lib/ai/resumeow/guardrails-scope";
import { evaluateSafetyGuardrails } from "@/lib/ai/resumeow/guardrails";
import { refreshFreeModels } from "@/lib/ai/resumeow/openrouter";
import { runTrimResumeToOnePage } from "@/lib/ai/resumeow/trim";
import { createOrchestratorEventWriter } from "@/lib/ai/resumeow/orchestrator/events";
import { runResumeowOrchestrator } from "@/lib/ai/resumeow/orchestrator/run";
import { DEFAULT_AI_REQUEST_QUOTA } from "@/lib/ai/resumeow/constants";
import {
  getAiQuotaRemaining,
  insertAiMessage,
  listAiMessages,
  listChangeSets,
  listJobDescriptions,
} from "@/lib/services/resume-server-service";
import {
  ResumeAiMessage,
  ResumeChangeSet,
  ResumeJobDescription,
  ResumeProfile,
  SavedResume,
} from "@/lib/types/resume";
import { SupabaseClient } from "@supabase/supabase-js";

function getLatestUserText(messages: Array<{ role: string; content: string }>) {
  const latestUserMessage = [...messages].reverse().find((message) => {
    return message.role === "user" && message.content.trim().length > 0;
  });

  if (!latestUserMessage) {
    throw new Error("Missing latest user message");
  }

  return latestUserMessage.content;
}

export async function loadResumeAiState(
  supabase: SupabaseClient,
  userId: string,
  resumeId: string
): Promise<{
  messages: ResumeAiMessage[];
  changeSets: ResumeChangeSet[];
  jobDescriptions: ResumeJobDescription[];
  aiRequestsRemaining: number;
}> {
  const [messages, changeSets, jobDescriptions, aiRequestsRemaining] =
    await Promise.all([
      listAiMessages(supabase, userId, resumeId),
      listChangeSets(supabase, userId, resumeId),
      listJobDescriptions(supabase, userId),
      getAiQuotaRemaining(supabase, userId, DEFAULT_AI_REQUEST_QUOTA),
    ]);

  return {
    messages,
    changeSets,
    jobDescriptions,
    aiRequestsRemaining,
  };
}

export async function runResumeowChat(payload: {
  supabase: SupabaseClient;
  userId: string;
  resume: SavedResume;
  profile: ResumeProfile | null;
  inputMessages: Array<{ role: string; content: string }>;
  actionHint?: "review" | "edit" | "trim" | null;
  jobDescriptionId?: string | null;
  writer: WritableStreamDefaultWriter<Uint8Array>;
}) {
  const latestUserMessage = getLatestUserText(payload.inputMessages);
  const eventWriter = createOrchestratorEventWriter(payload.writer);

  await eventWriter.write("planner_note", {
    label: "Reading your message and checking Resumeow's safety guardrails...",
    phase: "planning",
  });

  // One discovery per agentic run; every model call below reuses the snapshot.
  await refreshFreeModels();

  await insertAiMessage(payload.supabase, {
    userId: payload.userId,
    resumeId: payload.resume.id,
    role: "user",
    content: latestUserMessage,
  });

  // "Fit to 1 Page" button: a fixed in-scope action, so guardrails and the
  // scope classifier are skipped and the dedicated trim flow runs instead of
  // the orchestrator.
  if (payload.actionHint === "trim") {
    await runTrimResumeToOnePage({
      supabase: payload.supabase,
      userId: payload.userId,
      resume: payload.resume,
      profile: payload.profile,
      latestUserMessage,
      writer: eventWriter,
    });
    return;
  }

  // Past the trim branch the hint can only be review/edit.
  const actionHint = payload.actionHint ?? null;

  const safetyDecision = evaluateSafetyGuardrails({
    message: latestUserMessage,
  });
  if (!safetyDecision.allowed) {
    console.warn("Resumeow guardrail blocked prompt", {
      userId: payload.userId,
      resumeId: payload.resume.id,
      category: safetyDecision.category,
      code: safetyDecision.code,
    });

    const assistantMessage = await insertAiMessage(payload.supabase, {
      userId: payload.userId,
      resumeId: payload.resume.id,
      role: "assistant",
      content: safetyDecision.refusalMessage,
      metadata: {
        guardrail: {
          blocked: true,
          category: safetyDecision.category,
          code: safetyDecision.code,
        },
      },
    });

    await eventWriter.write("token", { text: safetyDecision.refusalMessage });
    await eventWriter.write("assistant_done", {
      message: assistantMessage,
    });
    return;
  }

  await eventWriter.write("planner_note", {
    label: "Checking whether this request is within Resumeow's resume workflow...",
    phase: "planning",
  });

  const persistedMessages = await listAiMessages(
    payload.supabase,
    payload.userId,
    payload.resume.id
  );
  const recentMessages = persistedMessages
    .filter((message) => message.role === "user" || message.role === "assistant")
    .slice(-8)
    .map((message) => ({
      role: message.role,
      content: message.content,
    })) as Array<{ role: "user" | "assistant"; content: string }>;

  const recentContextWithoutLatest =
    recentMessages.length > 0 &&
    recentMessages[recentMessages.length - 1]?.role === "user" &&
    recentMessages[recentMessages.length - 1]?.content === latestUserMessage
      ? recentMessages.slice(0, -1)
      : recentMessages;

  const scopeDecision = await classifyResumeScope({
    latestUserMessage,
    recentMessages: recentContextWithoutLatest,
    actionHint,
    hasSelectedJobDescription: Boolean(payload.jobDescriptionId),
    activeResumeTitle: payload.resume.title,
  });

  console.info("Resumeow scope decision", {
    userId: payload.userId,
    resumeId: payload.resume.id,
    latestUserMessage,
    recentMessageCount: recentContextWithoutLatest.length,
    decision: scopeDecision.decision,
    reasonCode: scopeDecision.reasonCode,
  });

  if (scopeDecision.decision !== "in_scope") {
    const code =
      scopeDecision.decision === "clarify"
        ? "needs_scope_clarification"
        : "out_of_scope";

    console.warn("Resumeow scope guardrail stopped prompt", {
      userId: payload.userId,
      resumeId: payload.resume.id,
      category: "scope",
      code,
      reasonCode: scopeDecision.reasonCode,
    });

    const assistantMessage = await insertAiMessage(payload.supabase, {
      userId: payload.userId,
      resumeId: payload.resume.id,
      role: "assistant",
      content: scopeDecision.assistantMessage,
      metadata: {
        guardrail: {
          blocked: true,
          category: "scope",
          code,
        },
      },
    });

    await eventWriter.write("token", { text: scopeDecision.assistantMessage });
    await eventWriter.write("assistant_done", {
      message: assistantMessage,
    });
    return;
  }

  await eventWriter.write("planner_note", {
    label: "Starting the agent workflow and choosing the best next step...",
    phase: "planning",
  });

  await runResumeowOrchestrator({
    supabase: payload.supabase,
    userId: payload.userId,
    resume: payload.resume,
    profile: payload.profile,
    latestUserMessage,
    actionHint,
    jobDescriptionId: payload.jobDescriptionId ?? null,
    writer: eventWriter,
  });
}
