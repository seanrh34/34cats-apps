import {
  OPENROUTER_CHAT_URL,
  OPENROUTER_EMBEDDINGS_URL,
  DEFAULT_OPENROUTER_EMBEDDING_MODEL,
  EMBEDDING_DIMENSIONS,
} from "@/lib/ai/resumeow/constants";

export interface OpenRouterMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_call_id?: string;
  tool_calls?: Array<{
    id: string;
    type: "function";
    function: {
      name: string;
      arguments: string;
    };
  }>;
}

export interface OpenRouterTool {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export type OpenRouterModelBucket =
  | "guardrails"
  | "orchestrator"
  | "analysis"
  | "mutation";

export type OpenRouterFailureClass =
  | "empty_content"
  | "invalid_json"
  | "schema_validation_failed"
  | "provider_http_error"
  | "rate_limited"
  | "timeout_or_abort";

export interface OpenRouterModelCandidate {
  model: string;
  isFallback: boolean;
}

export interface OpenRouterModelAttempt {
  model: string;
  isFallback: boolean;
  durationMs: number;
  failureClass?: OpenRouterFailureClass;
  errorMessage?: string;
}

class OpenRouterRequestError extends Error {
  status?: number;
  responseBody?: string;

  constructor(message: string, options?: { status?: number; responseBody?: string }) {
    super(message);
    this.name = "OpenRouterRequestError";
    this.status = options?.status;
    this.responseBody = options?.responseBody;
  }
}

function getAuthHeaders() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENROUTER_API_KEY");
  }

  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "https://apps.34cats.com",
    "X-Title": "Resumeow",
  };
}

function parseModelList(value?: string) {
  return (value ?? "")
    .split(",")
    .map((model) => model.trim())
    .filter(Boolean);
}

function getBucketPrimaryEnvName(bucket: OpenRouterModelBucket) {
  switch (bucket) {
    case "guardrails":
      return "OPENROUTER_MODEL_GUARDRAILS_PRIMARY";
    case "orchestrator":
      return "OPENROUTER_MODEL_ORCHESTRATOR_PRIMARY";
    case "analysis":
      return "OPENROUTER_MODEL_ANALYSIS_PRIMARY";
    case "mutation":
      return "OPENROUTER_MODEL_MUTATION_PRIMARY";
  }
}

function getBucketFallbackEnvName(bucket: OpenRouterModelBucket) {
  switch (bucket) {
    case "guardrails":
      return "OPENROUTER_MODEL_GUARDRAILS_FALLBACK";
    case "orchestrator":
      return "OPENROUTER_MODEL_ORCHESTRATOR_FALLBACK";
    case "analysis":
      return "OPENROUTER_MODEL_ANALYSIS_FALLBACK";
    case "mutation":
      return "OPENROUTER_MODEL_MUTATION_FALLBACK";
  }
}

function getPrimaryModels(bucket?: OpenRouterModelBucket) {
  const bucketValue = bucket
    ? process.env[getBucketPrimaryEnvName(bucket)]
    : undefined;
  const models = parseModelList(bucketValue || process.env.OPENROUTER_MODEL_PRIMARY);

  if (models.length === 0) {
    throw new Error(
      bucket
        ? `Missing ${getBucketPrimaryEnvName(bucket)} (or legacy OPENROUTER_MODEL_PRIMARY)`
        : "Missing OPENROUTER_MODEL_PRIMARY"
    );
  }

  return [...new Set(models)];
}

function getFallbackModel(bucket?: OpenRouterModelBucket) {
  if (bucket) {
    const bucketFallback = process.env[getBucketFallbackEnvName(bucket)]?.trim();
    if (bucketFallback) {
      return bucketFallback;
    }
  }

  return process.env.OPENROUTER_MODEL_FALLBACK?.trim() || null;
}

function isRateLimitError(error: unknown) {
  if (error instanceof OpenRouterRequestError && error.status === 429) {
    return true;
  }

  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return message.includes("rate limit") || message.includes("429");
}

export function classifyOpenRouterFailure(error: unknown): OpenRouterFailureClass {
  if (isRateLimitError(error)) {
    return "rate_limited";
  }

  if (error instanceof Error) {
    if (error.name === "AbortError") {
      return "timeout_or_abort";
    }
  }

  return "provider_http_error";
}

export function getChatModelCandidates(
  bucket?: OpenRouterModelBucket
): OpenRouterModelCandidate[] {
  const primaryModels = getPrimaryModels(bucket);
  const fallbackModel = getFallbackModel(bucket);

  const candidates: OpenRouterModelCandidate[] = primaryModels.map((model) => ({
    model,
    isFallback: false,
  }));

  if (
    fallbackModel &&
    !primaryModels.includes(fallbackModel)
  ) {
    candidates.push({
      model: fallbackModel,
      isFallback: true,
    });
  }

  return candidates;
}

function annotateResolvedModel<T>(
  value: T,
  payload: { model: string; isFallback: boolean }
) {
  if (value && typeof value === "object") {
    Object.assign(value as Record<string, unknown>, {
      _resolvedModel: payload.model,
      _usedFallbackModel: payload.isFallback,
    });
  }

  return value;
}

export async function createChatCompletionForModel(payload: {
  model: string;
  messages: OpenRouterMessage[];
  tools?: OpenRouterTool[];
  temperature?: number;
  toolChoice?: "auto" | "none";
  modelBucket?: OpenRouterModelBucket;
  requestLabel?: string;
  isFallback?: boolean;
}) {
  const startedAt = Date.now();
  console.info("Resumeow OpenRouter attempt_start", {
    requestLabel: payload.requestLabel ?? "OpenRouter chat completion",
    bucket: payload.modelBucket ?? null,
    model: payload.model,
    isFallback: Boolean(payload.isFallback),
  });

  try {
    const response = await fetch(OPENROUTER_CHAT_URL, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        model: payload.model,
        messages: payload.messages,
        tools: payload.tools,
        tool_choice: payload.toolChoice ?? "auto",
        parallel_tool_calls: false,
        temperature: payload.temperature ?? 0.2,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new OpenRouterRequestError(body || `OpenRouter error ${response.status}`, {
        status: response.status,
        responseBody: body,
      });
    }

    const json = await response.json();
    const durationMs = Date.now() - startedAt;
    console.info("Resumeow OpenRouter attempt_success", {
      requestLabel: payload.requestLabel ?? "OpenRouter chat completion",
      bucket: payload.modelBucket ?? null,
      model: payload.model,
      isFallback: Boolean(payload.isFallback),
      durationMs,
    });

    return annotateResolvedModel(json, {
      model: payload.model,
      isFallback: Boolean(payload.isFallback),
    });
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    const failureClass = classifyOpenRouterFailure(error);
    console.warn("Resumeow OpenRouter attempt_failure", {
      requestLabel: payload.requestLabel ?? "OpenRouter chat completion",
      bucket: payload.modelBucket ?? null,
      model: payload.model,
      isFallback: Boolean(payload.isFallback),
      durationMs,
      failureClass,
      errorMessage: error instanceof Error ? error.message : "Unknown OpenRouter error",
    });
    throw error;
  }
}

export async function runChatModelSequence<T>(payload: {
  bucket?: OpenRouterModelBucket;
  requestLabel: string;
  executor: (candidate: OpenRouterModelCandidate) => Promise<T>;
  shouldUseFallback?: (primaryAttempts: OpenRouterModelAttempt[]) => boolean;
}) {
  const candidates = getChatModelCandidates(payload.bucket);
  const primaryCandidates = candidates.filter((candidate) => !candidate.isFallback);
  const fallbackCandidate = candidates.find((candidate) => candidate.isFallback) ?? null;
  const attempts: OpenRouterModelAttempt[] = [];

  for (const candidate of primaryCandidates) {
    const startedAt = Date.now();
    try {
      const value = await payload.executor(candidate);
      return {
        value,
        model: candidate.model,
        isFallback: false,
        attempts,
      };
    } catch (error) {
      attempts.push({
        model: candidate.model,
        isFallback: false,
        durationMs: Date.now() - startedAt,
        failureClass: classifyOpenRouterFailure(error),
        errorMessage:
          error instanceof Error ? error.message : "Unknown OpenRouter error",
      });
    }
  }

  const shouldTryFallback =
    fallbackCandidate &&
    (payload.shouldUseFallback?.(attempts) ?? false);

  if (fallbackCandidate && shouldTryFallback) {
    const startedAt = Date.now();
    try {
      const value = await payload.executor(fallbackCandidate);
      return {
        value,
        model: fallbackCandidate.model,
        isFallback: true,
        attempts,
      };
    } catch (error) {
      attempts.push({
        model: fallbackCandidate.model,
        isFallback: true,
        durationMs: Date.now() - startedAt,
        failureClass: classifyOpenRouterFailure(error),
        errorMessage:
          error instanceof Error ? error.message : "Unknown OpenRouter error",
      });
    }
  }

  console.error("Resumeow OpenRouter sequence_exhausted", {
    requestLabel: payload.requestLabel,
    bucket: payload.bucket ?? null,
    attempts,
  });

  throw new Error(
    attempts
      .map((attempt) => `${attempt.model}: ${attempt.errorMessage}`)
      .join(" | ")
  );
}

async function fetchWithFallback<T>(
  builder: (model: string) => Promise<T>,
  bucket?: OpenRouterModelBucket
): Promise<T> {
  const result = await runChatModelSequence({
    bucket,
    requestLabel: "OpenRouter chat completion",
    executor: (candidate) => builder(candidate.model),
    shouldUseFallback: (primaryAttempts) =>
      primaryAttempts.length > 0 &&
      primaryAttempts.every((attempt) => attempt.failureClass === "rate_limited"),
  });

  return result.value;
}

export async function createChatCompletion(payload: {
  messages: OpenRouterMessage[];
  tools?: OpenRouterTool[];
  temperature?: number;
  toolChoice?: "auto" | "none";
  modelBucket?: OpenRouterModelBucket;
  modelOverride?: string;
}) {
  const modelOverride = payload.modelOverride?.trim() || null;

  if (modelOverride) {
    return createChatCompletionForModel({
      model: modelOverride,
      messages: payload.messages,
      tools: payload.tools,
      toolChoice: payload.toolChoice,
      temperature: payload.temperature,
      modelBucket: payload.modelBucket,
      requestLabel: "OpenRouter chat completion",
    });
  }

  return fetchWithFallback(async (model) => {
    return createChatCompletionForModel({
      model,
      messages: payload.messages,
      tools: payload.tools,
      toolChoice: payload.toolChoice,
      temperature: payload.temperature,
      modelBucket: payload.modelBucket,
      requestLabel: "OpenRouter chat completion",
    });
  }, payload.modelBucket);
}

export async function streamChatCompletion(
  payload: {
    messages: OpenRouterMessage[];
    temperature?: number;
    modelBucket?: OpenRouterModelBucket;
  },
  handlers: {
    onToken: (token: string) => Promise<void> | void;
  }
) {
  return fetchWithFallback(async (model) => {
    const response = await fetch(OPENROUTER_CHAT_URL, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        model,
        stream: true,
        messages: payload.messages,
        temperature: payload.temperature ?? 0.4,
      }),
    });

    if (!response.ok || !response.body) {
      const body = await response.text();
      throw new OpenRouterRequestError(body || `OpenRouter error ${response.status}`, {
        status: response.status,
        responseBody: body,
      });
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let text = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split("\n\n");
      buffer = events.pop() ?? "";

      for (const event of events) {
        const dataLines = event
          .split("\n")
          .filter((line) => line.startsWith("data:"))
          .map((line) => line.replace(/^data:\s*/, ""));

        for (const line of dataLines) {
          if (!line || line === "[DONE]") {
            continue;
          }

          const parsed = JSON.parse(line);
          const token = parsed.choices?.[0]?.delta?.content;
          if (typeof token === "string" && token.length > 0) {
            text += token;
            await handlers.onToken(token);
          }
        }
      }
    }

    return text;
  }, payload.modelBucket);
}

export async function createEmbeddings(values: string[]) {
  if (values.length === 0) {
    return [];
  }

  const response = await fetch(OPENROUTER_EMBEDDINGS_URL, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      model:
        process.env.OPENROUTER_EMBEDDING_MODEL ??
        DEFAULT_OPENROUTER_EMBEDDING_MODEL,
      input: values,
      encoding_format: "float",
      dimensions: EMBEDDING_DIMENSIONS,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new OpenRouterRequestError(
      body || `OpenRouter embeddings error ${response.status}`,
      {
        status: response.status,
        responseBody: body,
      }
    );
  }

  const payload = await response.json();
  return ((payload.data ?? []) as Array<{ embedding: number[] }>).map(
    (item, index) => {
      const embedding = item.embedding;
      if (embedding.length !== EMBEDDING_DIMENSIONS) {
        throw new Error(
          `Embedding dimension mismatch for input ${index}: expected ${EMBEDDING_DIMENSIONS}, received ${embedding.length}`
        );
      }

      return embedding;
    }
  );
}
