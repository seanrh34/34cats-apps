import { MAX_HISTORY_MESSAGES, MAX_ORCHESTRATOR_STEPS } from "@/lib/ai/resumeow/constants";
import {
  createChatCompletion,
  OpenRouterMessage,
} from "@/lib/ai/resumeow/openrouter";
import {
  buildOrchestratorUserPrompt,
  ORCHESTRATOR_SYSTEM_PROMPT,
  serializeCitations,
} from "@/lib/ai/resumeow/orchestrator/prompts";
import {
  OrchestratorConversationMessage,
  OrchestratorEventWriter,
  OrchestratorState,
} from "@/lib/ai/resumeow/orchestrator/types";
import { enforceRateLimit } from "@/lib/ai/resumeow/rate-limit";
import { getResumeowToolDefinition, getResumeowToolOpenRouterDefinitions } from "@/lib/ai/resumeow/tools/registry";
import { applyToolDefinition } from "@/lib/ai/resumeow/tools/apply";
import {
  insertAiMessage,
  listAiMessages,
} from "@/lib/services/resume-server-service";
import {
  ResumeAiMessage,
  ResumeAiProcessPhase,
  ResumeAiToolResult,
  ResumeChangeSet,
  ResumeProfile,
  SavedResume,
} from "@/lib/types/resume";
import {
  buildNoMaterialChangeAssistantMessage,
  buildEditAssistantMessage,
  normalizeAiMessageContent,
} from "@/lib/ai/resumeow/utils";
import { SupabaseClient } from "@supabase/supabase-js";

interface ToolCallLike {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

function mapPersistedMessages(messages: ResumeAiMessage[]) {
  return messages
    .filter((message) => message.role === "user" || message.role === "assistant")
    .slice(-MAX_HISTORY_MESSAGES)
    .map((message) => ({
      role: message.role,
      content: message.content,
    })) as Array<{ role: "user" | "assistant"; content: string }>;
}

function extractTextContent(message: unknown) {
  if (!message || typeof message !== "object") {
    return "";
  }

  const safeMessage = message as {
    content?: string | Array<{ text?: string }>;
  };

  if (typeof safeMessage.content === "string") {
    return safeMessage.content;
  }

  if (Array.isArray(safeMessage.content)) {
    return safeMessage.content
      .map((part) => part?.text ?? "")
      .filter(Boolean)
      .join("\n");
  }

  return "";
}

function extractResponseMessage(response: unknown) {
  const safeResponse = response as {
    choices?: Array<{
      message?: {
        content?: string | Array<{ text?: string }>;
        tool_calls?: ToolCallLike[];
      };
    }>;
  };

  return safeResponse.choices?.[0]?.message ?? null;
}

function normalizeToolCalls(message: ReturnType<typeof extractResponseMessage>) {
  return (message?.tool_calls ?? []).map((toolCall) => ({
    id: toolCall.id,
    type: "function" as const,
    function: {
      name: toolCall.function?.name ?? "",
      arguments: toolCall.function?.arguments ?? "{}",
    },
  }));
}

function parseToolArguments(toolCall: ToolCallLike) {
  try {
    return JSON.parse(toolCall.function.arguments || "{}") as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function enforceToolLimits(payload: {
  supabase: SupabaseClient;
  userId: string;
  category: "context" | "analysis" | "mutation" | "apply";
}) {
  const stepLimit = await enforceRateLimit(
    payload.supabase,
    payload.userId,
    "orchestrator_steps"
  );
  if (!stepLimit.allowed) {
    throw Object.assign(new Error("Orchestrator step rate limit exceeded"), {
      status: 429,
      rateLimit: stepLimit,
    });
  }

  if (payload.category === "analysis") {
    const analysisLimit = await enforceRateLimit(
      payload.supabase,
      payload.userId,
      "analysis_tools"
    );
    if (!analysisLimit.allowed) {
      throw Object.assign(new Error("Analysis rate limit exceeded"), {
        status: 429,
        rateLimit: analysisLimit,
      });
    }
  }

  if (payload.category === "mutation") {
    const mutationLimit = await enforceRateLimit(
      payload.supabase,
      payload.userId,
      "mutation_tools"
    );
    if (!mutationLimit.allowed) {
      throw Object.assign(new Error("Mutation rate limit exceeded"), {
        status: 429,
        rateLimit: mutationLimit,
      });
    }
  }

  if (payload.category === "apply") {
    const applyLimit = await enforceRateLimit(
      payload.supabase,
      payload.userId,
      "apply_resume_patch"
    );
    if (!applyLimit.allowed) {
      throw Object.assign(new Error("Apply rate limit exceeded"), {
        status: 429,
        rateLimit: applyLimit,
      });
    }
  }
}

function getProcessPhaseForToolCategory(
  category: "context" | "analysis" | "mutation" | "apply"
): ResumeAiProcessPhase {
  if (category === "context") {
    return "context";
  }

  if (category === "mutation" || category === "apply") {
    return "apply";
  }

  return "reasoning";
}

function buildToolMessageMetadata(payload: {
  runId: string;
  stepNumber: number;
  result: ResumeAiToolResult;
  stepLabel: string;
  phase: ResumeAiProcessPhase;
}) {
  const findings = Array.isArray(payload.result.data?.findings)
    ? (payload.result.data?.findings as Array<{
        id: string;
        title: string;
        severity: string;
        recommendation: string;
      }>)
    : undefined;

  return {
    orchestration: {
      runId: payload.runId,
      stepNumber: payload.stepNumber,
      toolName: payload.result.toolName,
      toolDisplayName: payload.result.toolDisplayName,
      kind: "tool_result" as const,
      mutatedResume: payload.result.mutatedResume ?? false,
      stepLabel: payload.stepLabel,
      phase: payload.phase,
    },
    findings,
    changeSet: payload.result.changeSet,
    diffItems: payload.result.diffItems,
  };
}

function buildToolResultPayload(payload: {
  stepNumber: number;
  stepLabel: string;
  result: ResumeAiToolResult;
  phase: ResumeAiProcessPhase;
}) {
  return {
    stepNumber: payload.stepNumber,
    stepLabel: payload.stepLabel,
    phase: payload.phase,
    toolName: payload.result.toolName,
    toolDisplayName: payload.result.toolDisplayName,
    summary: payload.result.summary,
    mutating: payload.result.mutatedResume ?? false,
    findings: payload.result.data?.findings,
    score: payload.result.data?.score,
    citations: serializeCitations(payload.result.citations),
    changeSet: payload.result.changeSet,
    diffItems: payload.result.diffItems,
    updatedResume: payload.result.updatedResume,
  };
}

function serializeToolResultForModel(result: ResumeAiToolResult) {
  // Strip bulk payloads the orchestrator never needs: the full proposed
  // resume lives in state, and diff before/after bodies are for the client.
  const {
    proposedResumeData: _proposedResumeData,
    selectedJobDescription: _selectedJobDescription,
    diffItems: _diffItems,
    ...data
  } = result.data ?? {};

  return JSON.stringify({
    toolName: result.toolName,
    summary: result.summary,
    citations: serializeCitations(result.citations),
    data,
    patchPrepared: (result.patchOperations?.length ?? 0) > 0,
    changedSections: [
      ...new Set((result.diffItems ?? []).map((item) => item.section)),
    ],
    mutatedResume: result.mutatedResume ?? false,
  });
}

function buildFallbackAssistantText(payload: {
  state: OrchestratorState;
  latestAppliedResult?: ResumeAiToolResult | null;
  latestAppliedChangeSet?: ResumeChangeSet | null;
}) {
  if (
    payload.latestAppliedResult?.diffItems &&
    payload.latestAppliedResult.diffItems.length > 0
  ) {
    return buildEditAssistantMessage({
      summary: payload.latestAppliedResult.summary,
      diffItems: payload.latestAppliedResult.diffItems,
    });
  }

  const lastToolSummary =
    payload.state.toolResults[payload.state.toolResults.length - 1]?.summary;

  if (lastToolSummary) {
    const lastTool = payload.state.toolResults[payload.state.toolResults.length - 1];
    if (
      payload.state.actionHint === "edit" &&
      (lastTool?.diffItems?.length ?? 0) === 0
    ) {
      return buildNoMaterialChangeAssistantMessage({
        latestUserMessage: payload.state.latestUserMessage,
        summary: lastToolSummary,
      });
    }

    return normalizeAiMessageContent(lastToolSummary);
  }

  return "I reviewed the request but need a little more detail before I can safely continue.";
}

function shouldOverrideWithNoMaterialEditMessage(payload: {
  state: OrchestratorState;
  latestAppliedResult?: ResumeAiToolResult | null;
}) {
  if (payload.latestAppliedResult?.diffItems?.length) {
    return false;
  }

  const lastTool = payload.state.toolResults[payload.state.toolResults.length - 1];
  if (!lastTool) {
    return false;
  }

  const isEditLikeRequest =
    payload.state.actionHint === "edit" ||
    /\b(edit|rewrite|revise|update|fix|improve|tailor|optimi[sz]e|implement|apply|change)\b/i.test(
      payload.state.latestUserMessage
    );

  return isEditLikeRequest && (lastTool.diffItems?.length ?? 0) === 0;
}

async function runWithProgress<T>(payload: {
  writer: OrchestratorEventWriter;
  label: string;
  phase: ResumeAiProcessPhase;
  heartbeatLabel?: string;
  heartbeatPhase?: ResumeAiProcessPhase;
  intervalMs?: number;
}, operation: () => Promise<T>) {
  const intervalMs = payload.intervalMs ?? 2500;

  await payload.writer.write("planner_note", {
    label: payload.label,
    phase: payload.phase,
  });

  let finished = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const queueHeartbeat = () => {
    if (finished) {
      return;
    }

    timer = setTimeout(() => {
      if (finished) {
        return;
      }

      void payload.writer.write("planner_note", {
        label: payload.heartbeatLabel ?? payload.label,
        phase: payload.heartbeatPhase ?? payload.phase,
      });
      queueHeartbeat();
    }, intervalMs);
  };

  queueHeartbeat();

  try {
    return await operation();
  } finally {
    finished = true;
    if (timer) {
      clearTimeout(timer);
    }
  }
}

export async function runResumeowOrchestrator(payload: {
  supabase: SupabaseClient;
  userId: string;
  resume: SavedResume;
  profile: ResumeProfile | null;
  latestUserMessage: string;
  actionHint?: "review" | "edit" | null;
  jobDescriptionId?: string | null;
  writer: OrchestratorEventWriter;
}) {
  const runId = crypto.randomUUID();
  const state: OrchestratorState = {
    runId,
    latestUserMessage: payload.latestUserMessage,
    actionHint: payload.actionHint ?? null,
    baseResume: payload.resume,
    workingResumeData: payload.resume.resume_data,
    profile: payload.profile,
    selectedJobDescriptionId: payload.jobDescriptionId ?? null,
    selectedJobDescription: null,
    toolResults: [],
    pendingPatchOperations: [],
    latestAppliedResult: null,
  };

  const persistedMessages = await listAiMessages(
    payload.supabase,
    payload.userId,
    payload.resume.id
  );
  const recentMessages = mapPersistedMessages(persistedMessages);
  const historyWithoutLatest =
    recentMessages.length > 0 &&
    recentMessages[recentMessages.length - 1]?.role === "user" &&
    recentMessages[recentMessages.length - 1]?.content === payload.latestUserMessage
      ? recentMessages.slice(0, -1)
      : recentMessages;

  const conversation: OrchestratorConversationMessage[] = [
    {
      role: "system",
      content: ORCHESTRATOR_SYSTEM_PROMPT,
    },
    ...historyWithoutLatest,
    {
      role: "user",
      content: buildOrchestratorUserPrompt({
        resume: payload.resume,
        profile: payload.profile,
        latestUserMessage: payload.latestUserMessage,
        actionHint: payload.actionHint ?? null,
        jobDescriptionId: payload.jobDescriptionId ?? null,
      }),
    },
  ];

  let finalAssistantText = "";
  let latestAppliedResult: ResumeAiToolResult | null = null;
  let latestAppliedChangeSet: ResumeChangeSet | null = null;

  for (let stepNumber = 1; stepNumber <= MAX_ORCHESTRATOR_STEPS; stepNumber += 1) {
    const response = await runWithProgress(
      {
        writer: payload.writer,
        label:
          stepNumber === 1
            ? "Understanding your request and deciding what to inspect first..."
            : "Reviewing the latest evidence and choosing the next best step...",
        phase: "planning",
        heartbeatLabel:
          stepNumber === 1
            ? "Still planning the best next step for your resume..."
            : "Still reasoning through the latest evidence and tool results...",
        heartbeatPhase: stepNumber === 1 ? "planning" : "reasoning",
      },
      () =>
        createChatCompletion({
          messages: conversation as OpenRouterMessage[],
          tools: getResumeowToolOpenRouterDefinitions(),
          toolChoice: "auto",
          temperature: 0.2,
          modelBucket: "orchestrator",
        })
    );

    const assistantResponseMessage = extractResponseMessage(response);
    const assistantText = normalizeAiMessageContent(
      extractTextContent(assistantResponseMessage)
    );
    const toolCalls = normalizeToolCalls(assistantResponseMessage);

    if (toolCalls.length === 0) {
      finalAssistantText = assistantText;
      break;
    }

    const toolCall = toolCalls[0];
    const toolDefinition = getResumeowToolDefinition(toolCall.function.name);
    if (!toolDefinition) {
      finalAssistantText =
        "I hit an unsupported internal tool path, so I couldn’t finish that safely. Please try again.";
      break;
    }

    const args = parseToolArguments(toolCall);
    const stepLabel = toolDefinition.buildStepLabel(args, state);
    const phase = getProcessPhaseForToolCategory(toolDefinition.category);

    console.info("Resumeow orchestrator tool_start", {
      runId,
      userId: payload.userId,
      resumeId: payload.resume.id,
      stepNumber,
      toolName: toolDefinition.name,
      toolDisplayName: toolDefinition.displayName,
      stepLabel,
      args,
    });

    await enforceToolLimits({
      supabase: payload.supabase,
      userId: payload.userId,
      category: toolDefinition.category,
    });

    conversation.push({
      role: "assistant",
      content: assistantText,
      tool_calls: [toolCall],
    });

    await payload.writer.write("tool_start", {
      stepNumber,
      toolName: toolDefinition.name,
      toolDisplayName: toolDefinition.displayName,
      stepLabel,
      phase,
      mutating: toolDefinition.mutating,
    });

    const result = await runWithProgress(
      {
        writer: payload.writer,
        label: stepLabel,
        phase,
        heartbeatLabel: `Still working: ${stepLabel.replace(/\.\.\.$/, "...")}`,
        heartbeatPhase: phase,
      },
      () =>
        toolDefinition.execute(
          {
            supabase: payload.supabase,
            userId: payload.userId,
            state,
            notifyProgress: async (progressPayload) => {
              await payload.writer.write("planner_note", {
                label: progressPayload.label,
                phase: progressPayload.phase ?? phase,
              });
            },
          },
          args
        )
    );

    console.info("Resumeow orchestrator tool_result", {
      runId,
      userId: payload.userId,
      resumeId: payload.resume.id,
      stepNumber,
      toolName: result.toolName,
      toolDisplayName: result.toolDisplayName,
      summary: result.summary,
      patchOperations: result.patchOperations?.length ?? 0,
      mutatedResume: result.mutatedResume ?? false,
      diffItems: result.diffItems?.length ?? 0,
    });

    state.toolResults.push(result);
    if (result.patchOperations?.length) {
      state.pendingPatchOperations.push(...result.patchOperations);
    }
    if (result.changeSet) {
      latestAppliedChangeSet = result.changeSet;
    }
    if (result.updatedResume) {
      latestAppliedResult = result;
      state.latestAppliedResult = result;
      state.baseResume = result.updatedResume;
      state.pendingPatchOperations = [];
    }

    await insertAiMessage(payload.supabase, {
      userId: payload.userId,
      resumeId: payload.resume.id,
      role: "tool",
      content: result.summary,
      toolName: result.toolName,
      toolCallId: toolCall.id,
      metadata: buildToolMessageMetadata({
        runId,
        stepNumber,
        result,
        stepLabel,
        phase,
      }),
    });

    await payload.writer.write(
      "tool_result",
      buildToolResultPayload({
        stepNumber,
        stepLabel,
        result,
        phase,
      })
    );

    conversation.push({
      role: "tool",
      tool_call_id: toolCall.id,
      content: serializeToolResultForModel(result),
    });
  }

  if (!latestAppliedResult && state.pendingPatchOperations.length > 0) {
    const stepNumber = state.toolResults.length + 1;
    const stepLabel = applyToolDefinition.buildStepLabel({}, state);
    const phase = getProcessPhaseForToolCategory("apply");

    await enforceToolLimits({
      supabase: payload.supabase,
      userId: payload.userId,
      category: "apply",
    });

    await payload.writer.write("tool_start", {
      stepNumber,
      toolName: applyToolDefinition.name,
      toolDisplayName: applyToolDefinition.displayName,
      stepLabel,
      phase,
      mutating: true,
    });

    const result = await runWithProgress(
      {
        writer: payload.writer,
        label: stepLabel,
        phase,
        heartbeatLabel:
          "Still applying grounded updates and saving them to the active resume...",
        heartbeatPhase: "apply",
      },
      () =>
        applyToolDefinition.execute(
          {
            supabase: payload.supabase,
            userId: payload.userId,
            state,
            notifyProgress: async (progressPayload) => {
              await payload.writer.write("planner_note", {
                label: progressPayload.label,
                phase: progressPayload.phase ?? phase,
              });
            },
          },
          {
            reason: payload.latestUserMessage,
          }
        )
    );

    console.info("Resumeow orchestrator tool_result", {
      runId,
      userId: payload.userId,
      resumeId: payload.resume.id,
      stepNumber,
      toolName: result.toolName,
      toolDisplayName: result.toolDisplayName,
      summary: result.summary,
      patchOperations: result.patchOperations?.length ?? 0,
      mutatedResume: result.mutatedResume ?? false,
      diffItems: result.diffItems?.length ?? 0,
    });
    state.toolResults.push(result);
    latestAppliedResult = result;
    latestAppliedChangeSet = result.changeSet ?? null;

    await insertAiMessage(payload.supabase, {
      userId: payload.userId,
      resumeId: payload.resume.id,
      role: "tool",
      content: result.summary,
      toolName: result.toolName,
      metadata: buildToolMessageMetadata({
        runId,
        stepNumber,
        result,
        stepLabel,
        phase,
      }),
    });

    await payload.writer.write(
      "tool_result",
      buildToolResultPayload({
        stepNumber,
        stepLabel,
        result,
        phase,
      })
    );
  }

  if (latestAppliedResult?.diffItems && latestAppliedResult.diffItems.length > 0) {
    finalAssistantText = buildEditAssistantMessage({
      summary: latestAppliedResult.summary,
      diffItems: latestAppliedResult.diffItems,
    });
  } else if (
    shouldOverrideWithNoMaterialEditMessage({
      state,
      latestAppliedResult,
    })
  ) {
    const lastToolSummary =
      state.toolResults[state.toolResults.length - 1]?.summary ?? null;
    finalAssistantText = buildNoMaterialChangeAssistantMessage({
      latestUserMessage: state.latestUserMessage,
      summary: lastToolSummary,
    });
  } else if (!finalAssistantText) {
    finalAssistantText = buildFallbackAssistantText({
      state,
      latestAppliedResult,
      latestAppliedChangeSet,
    });
  }

  await payload.writer.write("planner_note", {
    label: "Writing the final response for you...",
    phase: "reasoning",
  });

  await payload.writer.write("token", {
    text: finalAssistantText,
  });

  const assistantMessage = await insertAiMessage(payload.supabase, {
    userId: payload.userId,
    resumeId: payload.resume.id,
    role: "assistant",
    content: finalAssistantText,
    metadata: {
      orchestration: {
        runId,
        kind: "final",
        mutatedResume: Boolean(latestAppliedResult?.updatedResume),
      },
      changeSet: latestAppliedChangeSet,
      diffItems: latestAppliedResult?.diffItems,
    },
  });

  console.info("Resumeow orchestrator assistant_done", {
    runId,
    userId: payload.userId,
    resumeId: payload.resume.id,
    mutatedResume: Boolean(latestAppliedResult?.updatedResume),
    finalAssistantPreview: finalAssistantText.slice(0, 200),
  });

  await payload.writer.write("assistant_done", {
    message: assistantMessage,
  });
}
