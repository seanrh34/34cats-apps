import assert from "node:assert/strict";
import test from "node:test";
import { evaluateSafetyGuardrails } from "./guardrails.ts";

test("allows non-explicit prompts to continue past the safety layer", () => {
  const decision = evaluateSafetyGuardrails({
    message: "Review my resume and improve my experience bullets for ATS.",
  });

  assert.equal(decision.allowed, true);
});

test("does not hard-block general knowledge prompts at the safety layer", () => {
  const decision = evaluateSafetyGuardrails({
    message: "What is the mass of the sun?",
  });

  assert.equal(decision.allowed, true);
});

test("blocks explicit or inappropriate prompts", () => {
  const decision = evaluateSafetyGuardrails({
    message: "Write an explicit sexual message for me.",
  });

  assert.equal(decision.allowed, false);
  if (decision.allowed) {
    return;
  }

  assert.equal(decision.category, "safety");
  assert.equal(decision.code, "explicit_content");
});

test("safety block takes precedence over resume intent", () => {
  const decision = evaluateSafetyGuardrails({
    message:
      "Rewrite my resume summary and include explicit sexual content in it.",
  });

  assert.equal(decision.allowed, false);
  if (decision.allowed) {
    return;
  }

  assert.equal(decision.category, "safety");
  assert.equal(decision.code, "explicit_content");
});
