import { evaluateResumeGuardrails } from "@/lib/ai/resumeow/guardrails";
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

  const guardrailDecision = evaluateResumeGuardrails({
    message: latestUserMessage,
    actionHint: payload.actionHint ?? null,
  });
  if (!guardrailDecision.allowed) {
    console.warn("Resumeow guardrail blocked prompt", {
      userId: payload.userId,
      resumeId: payload.resume.id,
      category: guardrailDecision.category,
      code: guardrailDecision.code,
    });

    const assistantMessage = await insertAiMessage(payload.supabase, {
      userId: payload.userId,
      resumeId: payload.resume.id,
      role: "assistant",
      content: guardrailDecision.refusalMessage,
      metadata: {
        guardrail: {
          blocked: true,
          category: guardrailDecision.category,
          code: guardrailDecision.code,
        },
      },
    });

    await eventWriter.write("token", { text: guardrailDecision.refusalMessage });
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
