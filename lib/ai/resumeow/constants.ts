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
