import assert from "node:assert/strict";
import test from "node:test";
import { getChatModelCandidates, runChatModelSequence } from "./openrouter.ts";

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

test("getChatModelCandidates appends a distinct fallback model", async () => {
  await withEnv(
    {
      OPENROUTER_MODEL_ANALYSIS_PRIMARY: "model-a,model-b",
      OPENROUTER_MODEL_ANALYSIS_FALLBACK: "model-z",
    },
    () => {
      const candidates = getChatModelCandidates("analysis");
      assert.deepEqual(candidates, [
        { model: "model-a", isFallback: false },
        { model: "model-b", isFallback: false },
        { model: "model-z", isFallback: true },
      ]);
    }
  );
});

test("runChatModelSequence uses the fallback model after rate-limited primary failures", async () => {
  await withEnv(
    {
      OPENROUTER_MODEL_MUTATION_PRIMARY: "model-a,model-b",
      OPENROUTER_MODEL_MUTATION_FALLBACK: "model-z",
    },
    async () => {
      const calls: string[] = [];
      const result = await runChatModelSequence({
        bucket: "mutation",
        requestLabel: "test-sequence",
        executor: async ({ model }) => {
          calls.push(model);
          if (model === "model-z") {
            return "ok";
          }

          throw new Error("429 rate limit");
        },
        shouldUseFallback: (attempts) =>
          attempts.every((attempt) => attempt.failureClass === "rate_limited"),
      });

      assert.equal(result.value, "ok");
      assert.deepEqual(calls, ["model-a", "model-b", "model-z"]);
      assert.equal(result.model, "model-z");
      assert.equal(result.isFallback, true);
    }
  );
});

test("runChatModelSequence does not use the fallback model when failures are not eligible", async () => {
  await withEnv(
    {
      OPENROUTER_MODEL_ANALYSIS_PRIMARY: "model-a,model-b",
      OPENROUTER_MODEL_ANALYSIS_FALLBACK: "model-z",
    },
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
          shouldUseFallback: (attempts) =>
            attempts.every((attempt) => attempt.failureClass === "rate_limited"),
        }),
        /provider exploded/
      );

      assert.deepEqual(calls, ["model-a", "model-b"]);
    }
  );
});
