import assert from "node:assert/strict";
import test from "node:test";
import { evaluateResumeGuardrails } from "./guardrails";

test("allows resume review/edit requests", () => {
  const decision = evaluateResumeGuardrails({
    message: "Review my resume and improve my experience bullets for ATS.",
  });

  assert.equal(decision.allowed, true);
});

test("blocks out-of-scope general knowledge prompts", () => {
  const decision = evaluateResumeGuardrails({
    message: "What is the mass of the sun?",
  });

  assert.equal(decision.allowed, false);
  if (decision.allowed) {
    return;
  }

  assert.equal(decision.category, "scope");
  assert.equal(decision.code, "out_of_scope");
});

test("blocks explicit or inappropriate prompts", () => {
  const decision = evaluateResumeGuardrails({
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
  const decision = evaluateResumeGuardrails({
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
