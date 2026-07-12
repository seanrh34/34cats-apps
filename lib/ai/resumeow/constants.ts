export const OPENROUTER_CHAT_URL =
  "https://openrouter.ai/api/v1/chat/completions";
export const OPENROUTER_EMBEDDINGS_URL =
  "https://openrouter.ai/api/v1/embeddings";

export const EMBEDDING_DIMENSIONS = 1024;

export const RATE_LIMIT_CONFIG = {
  chat_requests: {
    limit: 20,
    windowSeconds: 5 * 60,
  },
  orchestrator_steps: {
    limit: 60,
    windowSeconds: 5 * 60,
  },
  analysis_tools: {
    limit: 20,
    windowSeconds: 60 * 60,
  },
  mutation_tools: {
    limit: 15,
    windowSeconds: 60 * 60,
  },
  apply_resume_patch: {
    limit: 10,
    windowSeconds: 60 * 60,
  },
} as const;

export const MAX_ORCHESTRATOR_STEPS = 5;

export const RETRIEVAL_LIMITS = {
  user_resume_history: 4,
  job_descriptions: 3,
  internal_resume_guides: 3,
  user_profile_docs: 2,
} as const;

export const MAX_HISTORY_MESSAGES = 8;

export const EXPLICIT_OR_INAPPROPRIATE_KEYWORDS = [
  "porn",
  "porno",
  "nsfw",
  "xxx",
  "nude",
  "nudes",
  "sex",
  "sexual",
  "blowjob",
  "handjob",
  "fetish",
  "erotic",
  "escort",
  "onlyfans",
  "kill",
  "murder",
  "suicide",
  "bomb",
] as const;

export const RESUME_GUARDRAIL_REFUSAL_MESSAGES = {
  scope:
    "I can only help with resume-related advice, review, and edits. Try asking me to review your current resume, tailor it to a role, or rewrite a specific section.",
  clarify:
    "I’m not fully sure whether you mean your active resume here. If you want, I can review it, apply earlier recommendations, or tailor it to your selected job description.",
  safety:
    "I can’t help with explicit or inappropriate content. If you want, I can still help improve your resume in a professional way.",
} as const;
