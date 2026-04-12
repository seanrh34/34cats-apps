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

function getPrimaryModels() {
  const models = parseModelList(process.env.OPENROUTER_MODEL_PRIMARY);

  if (models.length === 0) {
    throw new Error("Missing OPENROUTER_MODEL_PRIMARY");
  }

  return [...new Set(models)];
}

function getFallbackModel() {
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

async function fetchWithFallback<T>(
  builder: (model: string) => Promise<T>
): Promise<T> {
  const errors: string[] = [];
  const primaryModels = getPrimaryModels();
  const fallbackModel = getFallbackModel();
  let allPrimaryFailuresWereRateLimited = true;

  for (const model of primaryModels) {
    try {
      return await builder(model);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown OpenRouter error";
      errors.push(`${model}: ${message}`);
      if (!isRateLimitError(error)) {
        allPrimaryFailuresWereRateLimited = false;
      }
    }
  }

  if (fallbackModel && allPrimaryFailuresWereRateLimited) {
    try {
      return await builder(fallbackModel);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown OpenRouter error";
      errors.push(`${fallbackModel}: ${message}`);
    }
  }

  throw new Error(errors.join(" | "));
}

export async function createChatCompletion(payload: {
  messages: OpenRouterMessage[];
  tools?: OpenRouterTool[];
  temperature?: number;
  toolChoice?: "auto" | "none";
}) {
  return fetchWithFallback(async (model) => {
    const response = await fetch(OPENROUTER_CHAT_URL, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        model,
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

    return response.json();
  });
}

export async function streamChatCompletion(
  payload: {
    messages: OpenRouterMessage[];
    temperature?: number;
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
  });
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
