import { z } from "zod";
import { createChatCompletion } from "@/lib/ai/resumeow/openrouter";
import { RESUME_GUARDRAIL_REFUSAL_MESSAGES } from "@/lib/ai/resumeow/constants";
import { extractJsonFromText, normalizeAiMessageContent } from "@/lib/ai/resumeow/utils";

const scopeDecisionSchema = z.object({
  decision: z.enum(["in_scope", "out_of_scope", "clarify"]),
  reasonCode: z.string(),
  assistantMessage: z.string(),
});

export type ResumeScopeDecision =
  | {
      decision: "in_scope";
      reasonCode: string;
      assistantMessage: string;
    }
  | {
      decision: "out_of_scope" | "clarify";
      reasonCode: string;
      assistantMessage: string;
    };

function hasExplicitResumeIntent(message: string) {
  const normalized = message.toLowerCase().trim();

  const mentionsResumeArtifact =
    /\b(resume|cv|curriculum vitae)\b/.test(normalized);
  const mentionsResumeAction =
    /\b(review|edit|rewrite|revise|improve|tailor|optimi[sz]e|update|fix|reword|shorten|expand|critique|assess)\b/.test(
      normalized
    );
  const mentionsTargetRole =
    /\bfor\b.+\b(role|roles|job|position)\b/.test(normalized) ||
    /\bengineering roles?\b/.test(normalized);

  return (
    (mentionsResumeArtifact && mentionsResumeAction) ||
    (mentionsResumeArtifact && mentionsTargetRole)
  );
}

function hasObviousNonResumePivot(message: string) {
  const normalized = message.toLowerCase().trim();

  const mentionsResumeContext =
    /\b(resume|cv|curriculum vitae|bullet|experience|education|skills|project|job description|ats)\b/.test(
      normalized
    );

  if (mentionsResumeContext) {
    return false;
  }

  return /\b(mass of the sun|capital of|prime minister of|weather in|stock price of|solve\b|calculate\b|what is\b|who is\b|tell me about\b)\b/.test(
    normalized
  );
}

function hasResumeWorkflowContext(
  recentMessages: Array<{ role: "user" | "assistant"; content: string }>
) {
  return recentMessages.some((message) =>
    /\b(resume|cv|bullet|experience|education|skills|project|job description|ats|review|tailor|rewrite|recommendation|recommendations|suggestion|suggestions|summary of changes|finding|findings|priority|tweak|tweaks|edit|edits)\b/i.test(
      message.content
    )
  );
}

function hasContextualFollowUpIntent(payload: {
  latestUserMessage: string;
  recentMessages: Array<{ role: "user" | "assistant"; content: string }>;
}) {
  const normalized = payload.latestUserMessage.toLowerCase().trim();

  const directFollowUpPhrase =
    /^(do that|do it|apply it|apply that|use that|make the recommended changes|implement the recommended changes|implement the high priority tweaks?)$/.test(
      normalized
    );

  const mentionsFollowUpAction =
    /\b(apply|implement|make|use|incorporate|address|revise|rewrite|update|improve|tailor|fix)\b/.test(
      normalized
    );
  const mentionsPriorAdviceReference =
    /\b(recommended|recommendation|recommendations|suggested|suggestion|suggestions|feedback|changes|change|tweaks?|edits?|bullets?|points|high priority|priority)\b/.test(
      normalized
    );

  return (
    hasResumeWorkflowContext(payload.recentMessages) &&
    (directFollowUpPhrase ||
      (mentionsFollowUpAction && mentionsPriorAdviceReference))
  );
}

function normalizeScopeDecision(payload: {
  latestUserMessage: string;
  decision: ResumeScopeDecision;
}) {
  if (
    payload.decision.decision === "clarify" &&
    hasExplicitResumeIntent(payload.latestUserMessage)
  ) {
    return {
      decision: "in_scope",
      reasonCode: "explicit_resume_intent_override",
      assistantMessage: "This request is within Resumeow's scope.",
    } satisfies ResumeScopeDecision;
  }

  return payload.decision;
}

function buildScopeClassifierPrompt(payload: {
  latestUserMessage: string;
  recentMessages: Array<{ role: "user" | "assistant"; content: string }>;
  actionHint?: "review" | "edit" | null;
  hasSelectedJobDescription: boolean;
  activeResumeTitle: string;
}) {
  const recentHistory = payload.recentMessages
    .slice(-6)
    .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
    .join("\n");

  return `You are a scope classifier for Resumeow.

Resumeow only supports:
- resume review
- resume editing and rewriting
- tailoring a resume to a role or job description
- follow-up commands about the active resume or earlier resume suggestions

You must classify whether the user's latest message is within scope.
Do not answer the user's request.
Return JSON only with this exact shape:
{
  "decision": "in_scope" | "out_of_scope" | "clarify",
  "reasonCode": "string",
  "assistantMessage": "string"
}

Rules:
- If the latest message explicitly asks to review, edit, rewrite, tailor, optimize, or improve a resume or CV, classify it as "in_scope", not "clarify".
- If the latest message explicitly asks to review a resume for a target role, classify it as "in_scope".
- "in_scope" if the latest message is about the active resume, previous Resumeow advice, tailoring, review, edits, bullets, ATS alignment, or a follow-up command that clearly refers to the current resume workflow.
- "out_of_scope" if the user has clearly switched to unrelated general knowledge, coding help, entertainment, math, science, or other non-resume tasks.
- "clarify" if the latest message is too ambiguous even with recent chat context.
- If "out_of_scope", the assistantMessage should redirect the user back to resume-related help.
- If "clarify", the assistantMessage should ask a short clarification that points back to the active resume workflow.
- If "in_scope", the assistantMessage should still be a short, neutral scope-confirmation message and not answer the user's request.

Active resume title: ${payload.activeResumeTitle}
Selected job description currently active: ${payload.hasSelectedJobDescription ? "yes" : "no"}
Action hint: ${payload.actionHint ?? "none"}

Recent conversation:
${recentHistory || "No recent conversation."}

Latest user message:
${payload.latestUserMessage}

Examples:
- "review my resume for AI engineering roles" => in_scope
- "make the recommended changes" after prior resume suggestions => in_scope
- "what is the mass of the sun" => out_of_scope
- "do that" with no useful resume context => clarify`;
}

function defaultClarifyDecision(): ResumeScopeDecision {
  return {
    decision: "clarify",
    reasonCode: "classifier_unavailable",
    assistantMessage: RESUME_GUARDRAIL_REFUSAL_MESSAGES.clarify,
  };
}

export async function classifyResumeScope(payload: {
  latestUserMessage: string;
  recentMessages: Array<{ role: "user" | "assistant"; content: string }>;
  actionHint?: "review" | "edit" | null;
  hasSelectedJobDescription: boolean;
  activeResumeTitle: string;
}) {
  if (
    hasExplicitResumeIntent(payload.latestUserMessage) &&
    !hasObviousNonResumePivot(payload.latestUserMessage)
  ) {
    return {
      decision: "in_scope",
      reasonCode: "explicit_resume_intent_precheck",
      assistantMessage: "This request is within Resumeow's scope.",
    } satisfies ResumeScopeDecision;
  }

  if (
    hasContextualFollowUpIntent({
      latestUserMessage: payload.latestUserMessage,
      recentMessages: payload.recentMessages,
    }) &&
    !hasObviousNonResumePivot(payload.latestUserMessage)
  ) {
    return {
      decision: "in_scope",
      reasonCode: "resume_follow_up_context_precheck",
      assistantMessage: "This request is within Resumeow's scope.",
    } satisfies ResumeScopeDecision;
  }

  try {
    const response = await createChatCompletion({
      messages: [
        {
          role: "system",
          content: buildScopeClassifierPrompt(payload),
        },
      ],
      toolChoice: "none",
      temperature: 0,
      modelOverride:
        process.env.OPENROUTER_MODEL_GUARDRAILS?.trim() || "__PRIMARY_FIRST__",
    });

    const content = (() => {
      const message = (response as { choices?: Array<{ message?: unknown }> }).choices?.[0]
        ?.message;
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
    })();

    if (!content.trim()) {
      return normalizeScopeDecision({
        latestUserMessage: payload.latestUserMessage,
        decision: defaultClarifyDecision(),
      });
    }

    const parsed = scopeDecisionSchema.parse(
      JSON.parse(extractJsonFromText(content))
    );
    const normalizedAssistantMessage = normalizeAiMessageContent(
      parsed.assistantMessage
    );

    if (parsed.decision === "in_scope") {
      return normalizeScopeDecision({
        latestUserMessage: payload.latestUserMessage,
        decision: {
          decision: "in_scope",
          reasonCode: parsed.reasonCode,
          assistantMessage:
            normalizedAssistantMessage ||
            "This request is within Resumeow's scope.",
        },
      });
    }

    if (parsed.decision === "out_of_scope") {
      return normalizeScopeDecision({
        latestUserMessage: payload.latestUserMessage,
        decision: {
          decision: "out_of_scope",
          reasonCode: parsed.reasonCode,
          assistantMessage:
            normalizedAssistantMessage ||
            RESUME_GUARDRAIL_REFUSAL_MESSAGES.scope,
        },
      });
    }

    return normalizeScopeDecision({
      latestUserMessage: payload.latestUserMessage,
      decision: {
        decision: "clarify",
        reasonCode: parsed.reasonCode,
        assistantMessage:
          normalizedAssistantMessage || RESUME_GUARDRAIL_REFUSAL_MESSAGES.clarify,
      },
    });
  } catch (error) {
    console.error("Resumeow scope classifier failed", error);
    return normalizeScopeDecision({
      latestUserMessage: payload.latestUserMessage,
      decision: defaultClarifyDecision(),
    });
  }
}
