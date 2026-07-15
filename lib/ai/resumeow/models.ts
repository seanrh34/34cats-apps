// Server-side model registry for Resumeow AI.
//
// Chat models are discovered dynamically: the top free OpenRouter models are
// tried in order, then the single paid fallback below. This file is only
// imported from server code and is never exposed to the client bundle.

/** The only paid model, used after every free candidate has failed. */
export const PAID_FALLBACK_MODEL = "deepseek/deepseek-v4-flash";

/** How many free models to discover and try before the paid fallback. */
export const FREE_MODEL_COUNT = 5;
