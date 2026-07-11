import assert from "node:assert/strict";
import test from "node:test";
import { z } from "zod";
import {
  requestStructuredOutput,
  StructuredOutputExhaustedError,
} from "./shared.ts";

const schema = z.object({
  answer: z.string(),
});

function buildResponse(content: string) {
  return {
    choices: [
      {
        message: {
          content,
        },
      },
    ],
  };
}

test("requestStructuredOutput retries the same model after an empty response", async () => {
  const progress: string[] = [];
  const responses = [buildResponse(""), buildResponse('{"answer":"ok"}')];

  const result = await requestStructuredOutput({
    prompt: "Return JSON.",
    toolName: "review_resume_overall",
    toolDisplayName: "Review Resume Overall",
    schema,
    modelBucket: "analysis",
    modelCandidates: [{ model: "model-a", isFallback: false }],
    onProgress: async (label) => {
      progress.push(label);
    },
    createChatCompletionImpl: async () => responses.shift() ?? buildResponse(""),
  });

  assert.equal(result.parsed.answer, "ok");
  assert.equal(result.resolvedModel, "model-a");
  assert.equal(result.attempts.length, 2);
  assert.match(progress[0], /empty response/i);
});

test("requestStructuredOutput switches to the next primary model after repeated empty responses", async () => {
  const calls: string[] = [];

  const result = await requestStructuredOutput({
    prompt: "Return JSON.",
    toolName: "tailor_resume_to_job",
    toolDisplayName: "Tailor Resume To Job",
    schema,
    modelBucket: "mutation",
    modelCandidates: [
      { model: "model-a", isFallback: false },
      { model: "model-b", isFallback: false },
    ],
    createChatCompletionImpl: async ({ model }) => {
      calls.push(model);
      if (model === "model-b") {
        return buildResponse('{"answer":"ok"}');
      }

      return buildResponse("");
    },
  });

  assert.equal(result.parsed.answer, "ok");
  assert.deepEqual(calls, ["model-a", "model-a", "model-b"]);
});

test("requestStructuredOutput uses the fallback model after primary models return empty responses", async () => {
  const calls: string[] = [];

  const result = await requestStructuredOutput({
    prompt: "Return JSON.",
    toolName: "tailor_resume_to_job",
    toolDisplayName: "Tailor Resume To Job",
    schema,
    modelBucket: "mutation",
    modelCandidates: [
      { model: "model-a", isFallback: false },
      { model: "model-b", isFallback: false },
      { model: "model-z", isFallback: true },
    ],
    createChatCompletionImpl: async ({ model }) => {
      calls.push(model);
      if (model === "model-z") {
        return buildResponse('{"answer":"fallback"}');
      }

      return buildResponse("");
    },
  });

  assert.equal(result.parsed.answer, "fallback");
  assert.deepEqual(calls, ["model-a", "model-a", "model-b", "model-b", "model-z"]);
});

test("requestStructuredOutput fails over after invalid JSON responses", async () => {
  const progress: string[] = [];

  const result = await requestStructuredOutput({
    prompt: "Return JSON.",
    toolName: "review_resume_overall",
    toolDisplayName: "Review Resume Overall",
    schema,
    modelBucket: "analysis",
    modelCandidates: [
      { model: "model-a", isFallback: false },
      { model: "model-b", isFallback: false },
    ],
    onProgress: async (label) => {
      progress.push(label);
    },
    createChatCompletionImpl: async ({ model, temperature }) => {
      if (model === "model-b") {
        return buildResponse('{"answer":"recovered"}');
      }

      return buildResponse(temperature === 0 ? '{"answer":' : '{"answer":');
    },
  });

  assert.equal(result.parsed.answer, "recovered");
  assert.ok(progress.some((label) => /invalid json/i.test(label)));
});

test("requestStructuredOutput fails over after schema validation failures", async () => {
  const result = await requestStructuredOutput({
    prompt: "Return JSON.",
    toolName: "tailor_resume_to_job",
    toolDisplayName: "Tailor Resume To Job",
    schema,
    modelBucket: "mutation",
    modelCandidates: [
      { model: "model-a", isFallback: false },
      { model: "model-b", isFallback: false },
    ],
    createChatCompletionImpl: async ({ model }) => {
      if (model === "model-b") {
        return buildResponse('{"answer":"ok"}');
      }

      return buildResponse('{"wrongKey":"nope"}');
    },
  });

  assert.equal(result.parsed.answer, "ok");
});

test("requestStructuredOutput throws a tool-specific exhausted error after all attempts fail", async () => {
  const progress: string[] = [];

  await assert.rejects(
    requestStructuredOutput({
      prompt: "Return JSON.",
      toolName: "review_resume_overall",
      toolDisplayName: "Review Resume Overall",
      schema,
      modelBucket: "analysis",
      modelCandidates: [{ model: "model-a", isFallback: false }],
      onProgress: async (label) => {
        progress.push(label);
      },
      createChatCompletionImpl: async () => buildResponse(""),
    }),
    (error: unknown) => {
      assert.ok(error instanceof StructuredOutputExhaustedError);
      assert.match(error.message, /Review Resume Overall returned empty responses/i);
      assert.equal(error.toolName, "review_resume_overall");
      assert.equal(error.attempts.length, 2);
      return true;
    }
  );

  assert.ok(progress.length >= 1);
});
