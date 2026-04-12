import {
  EXPLICIT_OR_INAPPROPRIATE_KEYWORDS,
  RESUME_GUARDRAIL_REFUSAL_MESSAGES,
} from "@/lib/ai/resumeow/constants";

export type ResumeGuardrailCategory = "scope" | "safety";
export type ResumeGuardrailCode =
  | "out_of_scope"
  | "explicit_content"
  | "needs_scope_clarification";

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

function includesKeyword(text: string, keyword: string) {
  const normalizedKeyword = keyword.trim().toLowerCase();
  return normalizedKeyword ? text.includes(normalizedKeyword) : false;
}

function hasAnyKeyword(text: string, keywords: readonly string[]) {
  return keywords.some((keyword) => includesKeyword(text, keyword));
}

export function evaluateSafetyGuardrails(payload: {
  message: string;
}): ResumeGuardrailDecision {
  const message = payload.message.toLowerCase().trim();

  if (hasAnyKeyword(message, EXPLICIT_OR_INAPPROPRIATE_KEYWORDS)) {
    return {
      allowed: false,
      category: "safety",
      code: "explicit_content",
      refusalMessage: RESUME_GUARDRAIL_REFUSAL_MESSAGES.safety,
    };
  }

  return { allowed: true };
}
