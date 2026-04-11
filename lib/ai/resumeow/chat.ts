import { MAX_HISTORY_MESSAGES } from "@/lib/ai/resumeow/constants";
import {
  createChatCompletion,
  OpenRouterMessage,
} from "@/lib/ai/resumeow/openrouter";
import {
  buildFinalAssistantInput,
  FINAL_ASSISTANT_SYSTEM_PROMPT,
  TOOL_ROUTER_SYSTEM_PROMPT,
} from "@/lib/ai/resumeow/prompts";
import { enforceRateLimit } from "@/lib/ai/resumeow/rate-limit";
import {
  runProposeResumeChangesTool,
  runReviewResumeTool,
} from "@/lib/ai/resumeow/tools";
import { evaluateResumeGuardrails } from "@/lib/ai/resumeow/guardrails";
import { sseEvent } from "@/lib/ai/resumeow/utils";
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

interface ToolCallLike {
  id?: string;
  function?: {
    name?: string;
    arguments?: string;
  };
}

const TOOL_DEFINITIONS = [
  {
    type: "function" as const,
    function: {
      name: "review_resume",
      description:
        "Review the active resume and return grounded findings and recommendations.",
      parameters: {
        type: "object",
        properties: {
          focus: {
            type: "string",
            description:
              "What the user wants feedback on (role fit, clarity, impact, etc.).",
          },
        },
        required: ["focus"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "propose_resume_changes",
      description:
        "Draft grounded edits to the active resume and create a change set.",
      parameters: {
        type: "object",
        properties: {
          instruction: {
            type: "string",
            description:
              "What edits the user wants to make to the active resume.",
          },
        },
        required: ["instruction"],
      },
    },
  },
];

function inferActionHintFromUserMessage(
  message: string
): "review" | "edit" | null {
  const normalized = message.toLowerCase();
  const hasReviewIntent =
    /\b(review|critique|feedback|suggest|evaluate|assessment)\b/.test(
      normalized
    ) || /\bhow can i improve\b/.test(normalized);
  const hasEditIntent =
    /\b(change|rewrite|update|tailor|modify|edit|add|remove|replace|revise|fix|rework|refine|improve)\b/.test(
      normalized
    ) ||
    /\bmake .* resume\b/.test(normalized) ||
    /\buse .* profile\b/.test(normalized);

  if (hasReviewIntent && !hasEditIntent) {
    return "review";
  }

  if (hasEditIntent) {
    return "edit";
  }

  return null;
}

function buildSyntheticToolCall(
  actionHint: "review" | "edit",
  latestUserMessage: string
): ToolCallLike {
  return actionHint === "review"
    ? {
      id: crypto.randomUUID(),
      function: {
        name: "review_resume",
        arguments: JSON.stringify({ focus: latestUserMessage }),
      },
    }
    : {
      id: crypto.randomUUID(),
      function: {
        name: "propose_resume_changes",
        arguments: JSON.stringify({ instruction: latestUserMessage }),
      },
    };
}

function getLatestUserText(messages: Array<{ role: string; content: string }>) {
  const latestUserMessage = [...messages].reverse().find((message) => {
    return message.role === "user" && message.content.trim().length > 0;
  });

  if (!latestUserMessage) {
    throw new Error("Missing latest user message");
  }

  return latestUserMessage.content;
}

function mapPersistedMessages(messages: ResumeAiMessage[]): OpenRouterMessage[] {
  return messages
    .filter((message) => message.role === "user" || message.role === "assistant")
    .slice(-MAX_HISTORY_MESSAGES)
    .map((message) => ({
      role: message.role,
      content: message.content,
    }));
}

function parseToolArguments(toolCall: ToolCallLike) {
  const args = toolCall.function?.arguments;
  if (!args) {
    return {};
  }

  try {
    return JSON.parse(args);
  } catch {
    return {};
  }
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

function extractModelToolCalls(response: unknown): ToolCallLike[] {
  const safeResponse = response as {
    choices?: Array<{
      message?: {
        tool_calls?: Array<{
          id?: string;
          function?: {
            name?: string;
            arguments?: string;
          };
        }>;
      };
    }>;
  };

  return (safeResponse.choices?.[0]?.message?.tool_calls ?? []).map((call) => ({
    id: call.id,
    function: {
      name: call.function?.name,
      arguments: call.function?.arguments,
    },
  }));
}

function parseActionLikeContent(content: string) {
  const normalized = content.trim();
  if (!normalized.startsWith("{")) {
    return null;
  }

  try {
    const parsed = JSON.parse(normalized) as {
      action?: string;
      focus?: string;
      instruction?: string;
    };

    if (typeof parsed.action !== "string") {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function mapActionLikeToToolCall(
  actionPayload: {
    action?: string;
    focus?: string;
    instruction?: string;
  },
  latestUserMessage: string
): ToolCallLike | null {
  const action = (actionPayload.action ?? "").trim().toLowerCase();
  if (!action) {
    return null;
  }

  if (action === "review" || action === "review_resume") {
    return {
      id: crypto.randomUUID(),
      function: {
        name: "review_resume",
        arguments: JSON.stringify({
          focus: actionPayload.focus || latestUserMessage,
        }),
      },
    };
  }

  if (
    action === "propose_resume_changes" ||
    action === "edit_resume" ||
    action === "rewrite_resume" ||
    action === "update_resume" ||
    action === "modify_resume" ||
    action === "get-resume" ||
    action === "get_resume"
  ) {
    return {
      id: crypto.randomUUID(),
      function: {
        name: "propose_resume_changes",
        arguments: JSON.stringify({
          instruction: actionPayload.instruction || latestUserMessage,
        }),
      },
    };
  }

  return null;
}

function looksLikeActionPayload(content: string) {
  return parseActionLikeContent(content) !== null;
}

function buildFallbackAssistantText(payload: {
  toolResults: Array<{
    toolName: string;
    summary: string;
  }>;
}) {
  if (payload.toolResults.length === 0) {
    return "I can help with that. Share the exact change or review goal you want, and I will run it against your current resume.";
  }

  const editResult = payload.toolResults.find(
    (result) => result.toolName === "propose_resume_changes"
  );
  if (editResult) {
    return `${editResult.summary}\n\nThe active resume has been updated. You can undo this AI change if needed.`;
  }

  const reviewResult = payload.toolResults.find(
    (result) => result.toolName === "review_resume"
  );
  if (reviewResult) {
    return reviewResult.summary;
  }

  return payload.toolResults.map((result) => result.summary).join("\n\n");
}

async function routeToolCallsWithModel(payload: {
  latestUserMessage: string;
  recentMessages: Array<{ role: "user" | "assistant"; content: string }>;
}): Promise<ToolCallLike[]> {
  const routerResponse = await createChatCompletion({
    messages: [
      {
        role: "system",
        content: TOOL_ROUTER_SYSTEM_PROMPT,
      },
      ...payload.recentMessages.slice(-12),
      {
        role: "user",
        content: payload.latestUserMessage,
      },
    ],
    tools: TOOL_DEFINITIONS,
    toolChoice: "auto",
    temperature: 0,
  });

  const modelToolCalls = extractModelToolCalls(routerResponse).filter(
    (toolCall) =>
      toolCall.function?.name === "review_resume" ||
      toolCall.function?.name === "propose_resume_changes"
  );
  if (modelToolCalls.length > 0) {
    return modelToolCalls;
  }

  const routerText = extractTextContent(
    (routerResponse as { choices?: Array<{ message?: unknown }> }).choices?.[0]
      ?.message
  );
  const actionPayload = parseActionLikeContent(routerText);
  if (!actionPayload) {
    return [];
  }

  const mapped = mapActionLikeToToolCall(actionPayload, payload.latestUserMessage);
  return mapped ? [mapped] : [];
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
  skipToolRateLimits?: Array<"review_resume" | "propose_resume_changes">;
}) {
  const encoder = new TextEncoder();
  const write = async (event: string, data: unknown) => {
    await payload.writer.write(encoder.encode(sseEvent(event, data)));
  };

  const latestUserMessage = getLatestUserText(payload.inputMessages);
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

    await write("token", { text: guardrailDecision.refusalMessage });
    await write("assistant_done", {
      message: assistantMessage,
    });
    return;
  }

  const persistedMessages = await listAiMessages(
    payload.supabase,
    payload.userId,
    payload.resume.id
  );
  const history = mapPersistedMessages(persistedMessages);
  const recentMessages = history.filter(
    (message) => message.role === "user" || message.role === "assistant"
  ) as Array<{ role: "user" | "assistant"; content: string }>;

  let toolCalls: ToolCallLike[] = [];
  const resolvedActionHint =
    payload.actionHint ?? inferActionHintFromUserMessage(latestUserMessage);
  if (resolvedActionHint) {
    toolCalls = [buildSyntheticToolCall(resolvedActionHint, latestUserMessage)];
  } else {
    try {
      toolCalls = await routeToolCallsWithModel({
        latestUserMessage,
        recentMessages,
      });
    } catch {
      toolCalls = [];
    }
  }

  const toolResults: Array<{
    toolName: string;
    summary: string;
    serialized: string;
  }> = [];
  let latestAppliedChangeSet: ResumeChangeSet | null = null;
  let latestAppliedDiffItems: ResumeChangeSet["diff_items"] | null = null;

  for (const toolCall of toolCalls) {
    const toolName = toolCall?.function?.name;
    const args = parseToolArguments(toolCall);
    const shouldSkipLimit =
      toolName === "review_resume" || toolName === "propose_resume_changes"
        ? payload.skipToolRateLimits?.includes(toolName) ?? false
        : false;

    if (toolName === "review_resume" && !shouldSkipLimit) {
      const reviewLimit = await enforceRateLimit(
        payload.supabase,
        payload.userId,
        "review_resume"
      );

      if (!reviewLimit.allowed) {
        throw Object.assign(new Error("Review rate limit exceeded"), {
          status: 429,
          rateLimit: reviewLimit,
        });
      }
    }

    if (toolName === "propose_resume_changes" && !shouldSkipLimit) {
      const editLimit = await enforceRateLimit(
        payload.supabase,
        payload.userId,
        "propose_resume_changes"
      );

      if (!editLimit.allowed) {
        throw Object.assign(new Error("Edit rate limit exceeded"), {
          status: 429,
          rateLimit: editLimit,
        });
      }
    }

    await write("tool_start", {
      toolName,
    });

    if (toolName === "review_resume") {
      const result = await runReviewResumeTool({
        supabase: payload.supabase,
        userId: payload.userId,
        resume: payload.resume,
        profile: payload.profile,
        jobDescriptionId: payload.jobDescriptionId,
        focus:
          typeof args.focus === "string" && args.focus.trim()
            ? args.focus
            : latestUserMessage,
      });

      await insertAiMessage(payload.supabase, {
        userId: payload.userId,
        resumeId: payload.resume.id,
        role: "tool",
        content: result.summary,
        toolName,
        toolCallId: toolCall.id,
        metadata: {
          findings: result.findings,
        },
      });

      toolResults.push({
        toolName,
        summary: result.summary,
        serialized: JSON.stringify(result, null, 2),
      });

      await write("tool_result", {
        toolName,
        summary: result.summary,
        findings: result.findings,
      });
    }

    if (toolName === "propose_resume_changes") {
      const result = await runProposeResumeChangesTool({
        supabase: payload.supabase,
        userId: payload.userId,
        resume: payload.resume,
        profile: payload.profile,
        jobDescriptionId: payload.jobDescriptionId,
        instruction:
          typeof args.instruction === "string" && args.instruction.trim()
            ? args.instruction
            : latestUserMessage,
      });

      toolResults.push({
        toolName,
        summary: result.summary,
        serialized: JSON.stringify(
          {
            changeSet: result.changeSet,
            diffItems: result.diffItems,
            updatedResume: result.updatedResume,
          },
          null,
          2
        ),
      });
      if (result.changeSet) {
        latestAppliedChangeSet = result.changeSet;
        latestAppliedDiffItems = result.diffItems;
      }

      await write("tool_result", {
        toolName,
        summary: result.summary,
        changeSet: result.changeSet,
        diffItems: result.diffItems,
        updatedResume: result.updatedResume,
      });
    }
  }

  let assistantText = "";
  const finalAssistantResponse = await createChatCompletion({
    messages: [
      {
        role: "system",
        content: FINAL_ASSISTANT_SYSTEM_PROMPT,
      },
      ...recentMessages,
      {
        role: "user",
        content: buildFinalAssistantInput({
          resume: payload.resume,
          profile: payload.profile,
          recentMessages,
          latestUserMessage,
          toolResults,
        }),
      },
    ],
    toolChoice: "none",
    temperature: 0.4,
  });

  assistantText = extractTextContent(
    (finalAssistantResponse as { choices?: Array<{ message?: unknown }> })
      .choices?.[0]?.message
  ).trim();

  if (!assistantText || looksLikeActionPayload(assistantText)) {
    assistantText = buildFallbackAssistantText({ toolResults });
  }

  await write("token", { text: assistantText });

  const assistantMessage = await insertAiMessage(payload.supabase, {
    userId: payload.userId,
    resumeId: payload.resume.id,
    role: "assistant",
    content: assistantText,
    metadata: latestAppliedChangeSet
      ? {
          changeSet: latestAppliedChangeSet,
          diffItems: latestAppliedDiffItems ?? latestAppliedChangeSet.diff_items,
        }
      : {},
  });

  await write("assistant_done", {
    message: assistantMessage,
  });
}
