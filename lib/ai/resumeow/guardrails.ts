import {
  EXPLICIT_OR_INAPPROPRIATE_KEYWORDS,
  RESUME_FOLLOW_UP_EDIT_KEYWORDS,
  RESUME_FOLLOW_UP_REFERENCE_KEYWORDS,
  RESUME_GUARDRAIL_REFUSAL_MESSAGES,
  RESUME_SCOPE_KEYWORDS,
} from "@/lib/ai/resumeow/constants";

type ResumeActionHint = "review" | "edit" | null | undefined;

export type ResumeGuardrailCategory = "scope" | "safety";
export type ResumeGuardrailCode = "out_of_scope" | "explicit_content";

export type ResumeGuardrailDecision =
  | {
      allowed: true;
    }
  | {
      allowed: false;
      category: ResumeGuardrailCategory;
      code: ResumeGuardrailCode;
      refusalMessage: string;
    };

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function includesKeyword(text: string, keyword: string) {
  const normalizedKeyword = keyword.trim().toLowerCase();
  if (!normalizedKeyword) {
    return false;
  }

  if (normalizedKeyword.includes(" ")) {
    return text.includes(normalizedKeyword);
  }

  const pattern = new RegExp(`\\b${escapeRegExp(normalizedKeyword)}\\b`, "i");
  return pattern.test(text);
}

function hasAnyKeyword(text: string, keywords: readonly string[]) {
  return keywords.some((keyword) => includesKeyword(text, keyword));
}

export function evaluateResumeGuardrails(payload: {
  message: string;
  actionHint?: ResumeActionHint;
}): ResumeGuardrailDecision {
  const message = payload.message.toLowerCase().trim();
  const hasActionHint =
    payload.actionHint === "review" || payload.actionHint === "edit";

  if (hasAnyKeyword(message, EXPLICIT_OR_INAPPROPRIATE_KEYWORDS)) {
    return {
      allowed: false,
      category: "safety",
      code: "explicit_content",
      refusalMessage: RESUME_GUARDRAIL_REFUSAL_MESSAGES.safety,
    };
  }

  const hasResumeScope = hasAnyKeyword(message, RESUME_SCOPE_KEYWORDS);
  if (hasResumeScope) {
    return { allowed: true };
  }

  const hasFollowUpEditIntent =
    hasAnyKeyword(message, RESUME_FOLLOW_UP_EDIT_KEYWORDS) &&
    hasAnyKeyword(message, RESUME_FOLLOW_UP_REFERENCE_KEYWORDS);

  if (hasActionHint && hasFollowUpEditIntent) {
    return { allowed: true };
  }

  if (hasFollowUpEditIntent) {
    return { allowed: true };
  }

  return {
    allowed: false,
    category: "scope",
    code: "out_of_scope",
    refusalMessage: RESUME_GUARDRAIL_REFUSAL_MESSAGES.scope,
  };
}
