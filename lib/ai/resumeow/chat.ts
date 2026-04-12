import { classifyResumeScope } from "@/lib/ai/resumeow/guardrails-scope";
import { evaluateSafetyGuardrails } from "@/lib/ai/resumeow/guardrails";
import { createOrchestratorEventWriter } from "@/lib/ai/resumeow/orchestrator/events";
import { runResumeowOrchestrator } from "@/lib/ai/resumeow/orchestrator/run";
import {
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
}> {
  const [messages, changeSets, jobDescriptions] = await Promise.all([
    listAiMessages(supabase, userId, resumeId),
    listChangeSets(supabase, userId, resumeId),
    listJobDescriptions(supabase, userId),
  ]);

  return {
    messages,
    changeSets,
    jobDescriptions,
  };
}

export async function runResumeowChat(payload: {
  supabase: SupabaseClient;
  userId: string;
  resume: SavedResume;
  profile: ResumeProfile | null;
  inputMessages: Array<{ role: string; content: string }>;
  actionHint?: "review" | "edit" | null;
  jobDescriptionId?: string | null;
  writer: WritableStreamDefaultWriter<Uint8Array>;
}) {
  const latestUserMessage = getLatestUserText(payload.inputMessages);
  const eventWriter = createOrchestratorEventWriter(payload.writer);

  await insertAiMessage(payload.supabase, {
    userId: payload.userId,
    resumeId: payload.resume.id,
    role: "user",
    content: latestUserMessage,
  });

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
    actionHint: payload.actionHint ?? null,
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

  await runResumeowOrchestrator({
    supabase: payload.supabase,
    userId: payload.userId,
    resume: payload.resume,
    profile: payload.profile,
    latestUserMessage,
    actionHint: payload.actionHint ?? null,
    jobDescriptionId: payload.jobDescriptionId ?? null,
    writer: eventWriter,
  });
}
