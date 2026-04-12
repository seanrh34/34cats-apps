export const INTERNAL_RESUME_GUIDES = [
  {
    sourceKey: "internal-guide:truthfulness",
    title: "Resume Truthfulness Guardrail",
    content:
      "Never invent responsibilities, metrics, awards, technologies, leadership scope, or timelines. Treat concrete facts that the user explicitly provides in the current edit request as allowed evidence about their own background. Ask for clarification only when the user's request is ambiguous, internally inconsistent, or still missing the details needed for a safe edit. Prefer preserving factual accuracy over making a bullet sound stronger.",
  },
  {
    sourceKey: "internal-guide:tailoring",
    title: "Tailoring a Resume to a Job Description",
    content:
      "Tailor resumes by matching the employer's language only when the user's evidence supports it. Prioritize relevant experience, tools, and outcomes already present in the user's materials. Avoid keyword stuffing and keep claims defensible.",
  },
  {
    sourceKey: "internal-guide:bullet-quality",
    title: "High-Quality Resume Bullets",
    content:
      "Strong bullets usually start with a clear action, name the scope of work, and describe the result or impact. Prefer concise wording, active verbs, and specific outcomes. When numbers are unavailable, use concrete scope or business context instead of vague claims.",
  },
] as const;
