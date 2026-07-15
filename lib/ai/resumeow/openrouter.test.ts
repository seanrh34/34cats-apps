import assert from "node:assert/strict";
import test from "node:test";
import {
  createChatCompletionForModel,
  getChatModelCandidates,
  refreshFreeModels,
  resetFreeModelsCache,
  resetGatewayHealthCache,
  runChatModelSequence,
} from "./openrouter.ts";
import { PAID_FALLBACK_MODEL } from "./models.ts";

function withEnv(values: Record<string, string>, callback: () => Promise<void> | void) {
  const originalValues = new Map<string, string | undefined>();

  Object.entries(values).forEach(([key, value]) => {
    originalValues.set(key, process.env[key]);
    process.env[key] = value;
  });

  return Promise.resolve(callback()).finally(() => {
    originalValues.forEach((value, key) => {
      if (value === undefined) {
        delete process.env[key];
        return;
      }

      process.env[key] = value;
    });
  });
}

// Six free entries so discovery has to drop one; one lacks tool support, one is paid.
const modelListing = {
  data: [
    { id: "new/model-a:free", created: 600, supported_parameters: ["tools"] },
    { id: "old/model-f:free", created: 100, supported_parameters: ["tools"] },
    { id: "no-tools/model:free", created: 999, supported_parameters: ["temperature"] },
    { id: "paid/model", created: 998, supported_parameters: ["tools"] },
    { id: "new/model-b:free", created: 500, supported_parameters: ["tools"] },
    { id: "new/model-c:free", created: 400, supported_parameters: ["tools"] },
    { id: "new/model-d:free", created: 300, supported_parameters: ["tools"] },
    { id: "new/model-e:free", created: 200, supported_parameters: ["tools"] },
  ],
};

const expectedFreeModels = [
  "new/model-a:free",
  "new/model-b:free",
  "new/model-c:free",
  "new/model-d:free",
  "new/model-e:free",
];

test("getChatModelCandidates discovers the 5 newest tool-capable free models then the paid fallback", async () => {
  resetFreeModelsCache();
  await withFetch(
    async (url) => {
      assert.equal(url, "https://openrouter.ai/api/v1/models");
      return okJson(modelListing);
    },
    async () => {
      const candidates = await getChatModelCandidates();
      assert.deepEqual(candidates, [
        ...expectedFreeModels.map((model) => ({ model, isFallback: false })),
        { model: PAID_FALLBACK_MODEL, isFallback: true },
      ]);
    }
  );
});

test("refreshFreeModels snapshots once per run; later calls do not rediscover", async () => {
  resetFreeModelsCache();
  let discoveryCalls = 0;
  await withFetch(
    async () => {
      discoveryCalls += 1;
      return okJson(modelListing);
    },
    async () => {
      await refreshFreeModels();
      await getChatModelCandidates();
      await getChatModelCandidates();
      assert.equal(discoveryCalls, 1);
    }
  );
});

test("getChatModelCandidates falls back to the paid model only when discovery fails with no prior snapshot", async () => {
  resetFreeModelsCache();
  await withFetch(
    async () => {
      throw new Error("network down");
    },
    async () => {
      const candidates = await getChatModelCandidates();
      assert.deepEqual(candidates, [
        { model: PAID_FALLBACK_MODEL, isFallback: true },
      ]);
    }
  );
});

test("refreshFreeModels keeps the previous snapshot when a later discovery fails", async () => {
  resetFreeModelsCache();
  await withFetch(
    async () => okJson(modelListing),
    async () => {
      await refreshFreeModels();
    }
  );
  await withFetch(
    async () => {
      throw new Error("network down");
    },
    async () => {
      const models = await refreshFreeModels();
      assert.deepEqual(models, expectedFreeModels);
    }
  );
});

test("runChatModelSequence tries every free model before the paid fallback", async () => {
  resetFreeModelsCache();
  await withFetch(
    async () => okJson(modelListing),
    async () => {
      const calls: string[] = [];
      const result = await runChatModelSequence({
        bucket: "analysis",
        requestLabel: "test-sequence",
        executor: async ({ model, isFallback }) => {
          calls.push(model);
          if (isFallback) {
            return "ok";
          }

          throw new Error("free model failed");
        },
      });

      assert.equal(result.value, "ok");
      assert.deepEqual(calls, [...expectedFreeModels, PAID_FALLBACK_MODEL]);
      assert.equal(result.model, PAID_FALLBACK_MODEL);
      assert.equal(result.isFallback, true);
      assert.equal(result.attempts.length, expectedFreeModels.length);
    }
  );
});

test("runChatModelSequence surfaces an exhausted error when the paid fallback also fails", async () => {
  resetFreeModelsCache();
  await withFetch(
    async () => okJson(modelListing),
    async () => {
      const calls: string[] = [];

      await assert.rejects(
        runChatModelSequence({
          bucket: "analysis",
          requestLabel: "test-sequence",
          executor: async ({ model }) => {
            calls.push(model);
            throw new Error("provider exploded");
          },
        }),
        /provider exploded/
      );

      assert.deepEqual(calls, [...expectedFreeModels, PAID_FALLBACK_MODEL]);
    }
  );
});

function withFetch(
  impl: (url: string, init?: RequestInit) => Promise<Response>,
  callback: () => Promise<void>
) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = impl as typeof fetch;
  return callback().finally(() => {
    globalThis.fetch = originalFetch;
  });
}

const okJson = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

test("createChatCompletionForModel routes through the LiteLLM gateway when healthy", async () => {
  resetGatewayHealthCache();
  await withEnv(
    {
      LITELLM_BASE_URL: "http://gateway.test",
      LITELLM_API_KEY: "gw-key",
      OPENROUTER_API_KEY: "or-key",
    },
    () =>
      withFetch(
        async (url, init) => {
          if (url === "http://gateway.test/v1/models") {
            return okJson({ data: [] });
          }

          assert.equal(url, "http://gateway.test/v1/chat/completions");
          assert.equal(JSON.parse(String(init?.body)).model, "free");
          return okJson({ choices: [{ message: { content: "hi" } }] });
        },
        async () => {
          const response = await createChatCompletionForModel({
            model: "some/openrouter-model",
            messages: [{ role: "user", content: "hello" }],
          });
          assert.equal(response.choices[0].message.content, "hi");
          assert.equal(response._resolvedModel, "free");
        }
      )
  );
});

test("createChatCompletionForModel falls back to OpenRouter when the gateway fails", async () => {
  resetGatewayHealthCache();
  await withEnv(
    {
      LITELLM_BASE_URL: "http://gateway.test",
      LITELLM_API_KEY: "gw-key",
      OPENROUTER_API_KEY: "or-key",
    },
    () =>
      withFetch(
        async (url, init) => {
          if (url === "http://gateway.test/v1/models") {
            return okJson({ data: [] });
          }

          if (url === "http://gateway.test/v1/chat/completions") {
            return new Response("gateway exploded", { status: 500 });
          }

          assert.equal(url, "https://openrouter.ai/api/v1/chat/completions");
          assert.equal(
            JSON.parse(String(init?.body)).model,
            "some/openrouter-model"
          );
          return okJson({ choices: [{ message: { content: "fallback" } }] });
        },
        async () => {
          const response = await createChatCompletionForModel({
            model: "some/openrouter-model",
            messages: [{ role: "user", content: "hello" }],
          });
          assert.equal(response.choices[0].message.content, "fallback");

          // Gateway is now marked down: the next request must skip it entirely.
          const calls: string[] = [];
          globalThis.fetch = (async (url: string) => {
            calls.push(url);
            return okJson({ choices: [{ message: { content: "again" } }] });
          }) as typeof fetch;
          await createChatCompletionForModel({
            model: "some/openrouter-model",
            messages: [{ role: "user", content: "hello" }],
          });
          assert.deepEqual(calls, [
            "https://openrouter.ai/api/v1/chat/completions",
          ]);
        }
      )
  );
});

test("createChatCompletionForModel skips the gateway when LITELLM_BASE_URL is unset", async () => {
  resetGatewayHealthCache();
  await withEnv(
    {
      LITELLM_BASE_URL: "",
      OPENROUTER_API_KEY: "or-key",
    },
    () =>
      withFetch(
        async (url) => {
          assert.equal(url, "https://openrouter.ai/api/v1/chat/completions");
          return okJson({ choices: [{ message: { content: "direct" } }] });
        },
        async () => {
          const response = await createChatCompletionForModel({
            model: "some/openrouter-model",
            messages: [{ role: "user", content: "hello" }],
          });
          assert.equal(response.choices[0].message.content, "direct");
        }
      )
  );
});
