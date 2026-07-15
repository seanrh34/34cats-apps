import { OPENROUTER_CHAT_URL } from "@/lib/ai/resumeow/constants";
import {
  FREE_MODEL_COUNT,
  PAID_FALLBACK_MODEL,
} from "@/lib/ai/resumeow/models";

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

// --- LiteLLM gateway (preferred provider when reachable) -------------------
// The gateway is only periodically online. We probe it (cached for a short
// TTL) and route chat completions through it with its single "free" model;
// any gateway failure marks it down and the request falls back to OpenRouter.
// Embeddings always use OpenRouter — the gateway does not host the embedding model.

const LITELLM_CHAT_MODEL = "free";
const GATEWAY_STATUS_TTL_MS = 60_000;
const GATEWAY_PROBE_TIMEOUT_MS = 2_000;

let gatewayStatus: { healthy: boolean; expiresAt: number } | null = null;

export function resetGatewayHealthCache() {
  gatewayStatus = null;
}

function getGatewayBaseUrl() {
  return process.env.LITELLM_BASE_URL?.trim().replace(/\/+$/, "") || null;
}

function getGatewayHeaders() {
  return {
    Authorization: `Bearer ${process.env.LITELLM_API_KEY ?? ""}`,
    "Content-Type": "application/json",
  };
}

function markGatewayDown() {
  gatewayStatus = { healthy: false, expiresAt: Date.now() + GATEWAY_STATUS_TTL_MS };
}

async function isGatewayAvailable() {
  const baseUrl = getGatewayBaseUrl();
  if (!baseUrl) {
    return false;
  }

  if (gatewayStatus && Date.now() < gatewayStatus.expiresAt) {
    return gatewayStatus.healthy;
  }

  let healthy = false;
  try {
    const response = await fetch(`${baseUrl}/v1/models`, {
      headers: getGatewayHeaders(),
      signal: AbortSignal.timeout(GATEWAY_PROBE_TIMEOUT_MS),
    });
    healthy = response.ok;
  } catch {
    healthy = false;
  }

  gatewayStatus = { healthy, expiresAt: Date.now() + GATEWAY_STATUS_TTL_MS };
  console.info("Resumeow LiteLLM gateway probe", { baseUrl, healthy });
  return healthy;
}

interface ChatProviderTarget {
  provider: "litellm" | "openrouter";
  url: string;
  headers: Record<string, string>;
  model: string;
}

function getOpenRouterTarget(model: string): ChatProviderTarget {
  return {
    provider: "openrouter",
    url: OPENROUTER_CHAT_URL,
    headers: getAuthHeaders(),
    model,
  };
}

function getGatewayTarget(): ChatProviderTarget {
  return {
    provider: "litellm",
    url: `${getGatewayBaseUrl()}/v1/chat/completions`,
    headers: getGatewayHeaders(),
    model: LITELLM_CHAT_MODEL,
  };
}

// --- Free model discovery ---------------------------------------------------
// The top free OpenRouter models are tried in order before the single paid
// fallback. "Top" = tool-capable :free models, newest first — the public
// /models endpoint exposes no popularity signal, and tool support is required
// by the orchestrator. Discovery runs once at the start of each agentic run
// (refreshFreeModels); every model call in that run reuses the snapshot.

const OPENROUTER_MODELS_URL = "https://openrouter.ai/api/v1/models";

let freeModelsSnapshot: string[] | null = null;

export function resetFreeModelsCache() {
  freeModelsSnapshot = null;
}

async function fetchTopFreeModels(): Promise<string[]> {
  const response = await fetch(OPENROUTER_MODELS_URL, {
    signal: AbortSignal.timeout(5_000),
  });
  if (!response.ok) {
    throw new Error(`OpenRouter models error ${response.status}`);
  }

  const json = await response.json();
  const models = ((json.data ?? []) as Array<{
    id?: string;
    created?: number;
    supported_parameters?: string[];
  }>)
    .filter(
      (model) =>
        typeof model.id === "string" &&
        model.id.endsWith(":free") &&
        (model.supported_parameters ?? []).includes("tools")
    )
    .sort((a, b) => (b.created ?? 0) - (a.created ?? 0))
    .slice(0, FREE_MODEL_COUNT)
    .map((model) => model.id as string);

  if (models.length === 0) {
    throw new Error("No tool-capable free models found");
  }

  return models;
}

/**
 * Run free-model discovery once, at the start of an agentic run. All model
 * calls in the run then reuse the snapshot. On failure, keeps the previous
 * snapshot if one exists; otherwise the run uses only the paid fallback.
 */
export async function refreshFreeModels(): Promise<string[]> {
  try {
    freeModelsSnapshot = await fetchTopFreeModels();
    console.info("Resumeow free model discovery succeeded", {
      models: freeModelsSnapshot,
    });
  } catch (error) {
    console.warn("Resumeow free model discovery failed", {
      errorMessage: error instanceof Error ? error.message : "Unknown error",
      previousSnapshot: freeModelsSnapshot,
    });
  }

  return freeModelsSnapshot ?? [];
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

export async function getChatModelCandidates(): Promise<
  OpenRouterModelCandidate[]
> {
  // Reuse the run's snapshot; only discover here if the run never primed one.
  const freeModels = freeModelsSnapshot ?? (await refreshFreeModels());

  return [
    ...freeModels.map((model) => ({ model, isFallback: false })),
    { model: PAID_FALLBACK_MODEL, isFallback: true },
  ];
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

interface ChatCompletionPayload {
  model: string;
  messages: OpenRouterMessage[];
  tools?: OpenRouterTool[];
  temperature?: number;
  toolChoice?: "auto" | "none";
  modelBucket?: OpenRouterModelBucket;
  requestLabel?: string;
  isFallback?: boolean;
}

async function executeChatCompletion(
  payload: ChatCompletionPayload,
  target: ChatProviderTarget
) {
  const startedAt = Date.now();
  const logContext = {
    requestLabel: payload.requestLabel ?? "Chat completion",
    bucket: payload.modelBucket ?? null,
    provider: target.provider,
    model: target.model,
    isFallback: Boolean(payload.isFallback),
  };
  console.info("Resumeow chat attempt_start", logContext);

  try {
    const response = await fetch(target.url, {
      method: "POST",
      headers: target.headers,
      body: JSON.stringify({
        model: target.model,
        messages: payload.messages,
        tools: payload.tools,
        tool_choice: payload.toolChoice ?? "auto",
        parallel_tool_calls: false,
        temperature: payload.temperature ?? 0.2,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new OpenRouterRequestError(
        body || `${target.provider} error ${response.status}`,
        {
          status: response.status,
          responseBody: body,
        }
      );
    }

    const json = await response.json();
    console.info("Resumeow chat attempt_success", {
      ...logContext,
      durationMs: Date.now() - startedAt,
    });

    return annotateResolvedModel(json, {
      model: target.model,
      isFallback: Boolean(payload.isFallback),
    });
  } catch (error) {
    console.warn("Resumeow chat attempt_failure", {
      ...logContext,
      durationMs: Date.now() - startedAt,
      failureClass: classifyOpenRouterFailure(error),
      errorMessage: error instanceof Error ? error.message : "Unknown provider error",
    });
    throw error;
  }
}

export async function createChatCompletionForModel(payload: ChatCompletionPayload) {
  if (await isGatewayAvailable()) {
    try {
      return await executeChatCompletion(payload, getGatewayTarget());
    } catch {
      // Gateway failed mid-flight: mark it down so subsequent requests skip
      // the probe, then retry this same request against OpenRouter.
      markGatewayDown();
    }
  }

  return executeChatCompletion(payload, getOpenRouterTarget(payload.model));
}

export async function runChatModelSequence<T>(payload: {
  bucket?: OpenRouterModelBucket;
  requestLabel: string;
  executor: (candidate: OpenRouterModelCandidate) => Promise<T>;
}) {
  const candidates = await getChatModelCandidates();
  const attempts: OpenRouterModelAttempt[] = [];

  for (const candidate of candidates) {
    const startedAt = Date.now();
    try {
      const value = await payload.executor(candidate);
      return {
        value,
        model: candidate.model,
        isFallback: candidate.isFallback,
        attempts,
      };
    } catch (error) {
      attempts.push({
        model: candidate.model,
        isFallback: candidate.isFallback,
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
