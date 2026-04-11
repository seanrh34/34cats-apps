export const OPENROUTER_CHAT_URL =
  "https://openrouter.ai/api/v1/chat/completions";
export const OPENROUTER_EMBEDDINGS_URL =
  "https://openrouter.ai/api/v1/embeddings";

export const DEFAULT_OPENROUTER_EMBEDDING_MODEL =
  "baai/bge-m3";
export const EMBEDDING_DIMENSIONS = 1024;

export const RATE_LIMIT_CONFIG = {
  chat_requests: {
    limit: 20,
    windowSeconds: 5 * 60,
  },
  review_resume: {
    limit: 10,
    windowSeconds: 60 * 60,
  },
  propose_resume_changes: {
    limit: 10,
    windowSeconds: 60 * 60,
  },
} as const;

export const RETRIEVAL_LIMITS = {
  user_resume_history: 4,
  job_descriptions: 3,
  internal_resume_guides: 3,
  user_profile_docs: 2,
} as const;

export const MAX_HISTORY_MESSAGES = 8;

export const RESUME_SCOPE_KEYWORDS = [
  "resume",
  "cv",
  "curriculum vitae",
  "work experience",
  "experience",
  "education",
  "skills",
  "projects",
  "bullet",
  "achievements",
  "job description",
  "job post",
  "hiring manager",
  "ats",
  "tailor",
  "application",
  "career summary",
  "professional summary",
  "cover letter",
] as const;

export const RESUME_FOLLOW_UP_EDIT_KEYWORDS = [
  "edit",
  "update",
  "rewrite",
  "refine",
  "improve",
  "shorten",
  "expand",
  "tailor",
  "fix",
  "change",
  "reword",
] as const;

export const RESUME_FOLLOW_UP_REFERENCE_KEYWORDS = [
  "this",
  "that",
  "it",
  "these",
  "those",
  "my current one",
] as const;

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
  safety:
    "I can’t help with explicit or inappropriate content. If you want, I can still help improve your resume in a professional way.",
} as const;
