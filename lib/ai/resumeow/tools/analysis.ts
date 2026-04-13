import { buildAnalysisToolPrompt, buildToolContextBlock } from "@/lib/ai/resumeow/orchestrator/prompts";
import { OrchestratorToolDefinition } from "@/lib/ai/resumeow/orchestrator/types";
import { retrieveSupportingContext } from "@/lib/ai/resumeow/rag";
import {
  analysisResultSchema,
  buildWorkingResume,
  mapCitationIds,
  parseStructuredJson,
  requestStructuredJsonContent,
} from "@/lib/ai/resumeow/tools/shared";
import {
  includesForbiddenFieldOrderLanguage,
  normalizeAiMessageContent,
} from "@/lib/ai/resumeow/utils";

function sanitizeAnalysisPayload(payload: {
  summary: string;
  findings: Array<{
    id: string;
    severity: "low" | "medium" | "high";
    title: string;
    recommendation: string;
    citations: ReturnType<typeof mapCitationIds>;
  }>;
  fallbackSummary: string;
}) {
  const findings = payload.findings
    .map((finding) => ({
      ...finding,
      title: normalizeAiMessageContent(finding.title),
      recommendation: normalizeAiMessageContent(finding.recommendation),
    }))
    .filter((finding) => {
      const combinedText = `${finding.title}\n${finding.recommendation}`;
      return !includesForbiddenFieldOrderLanguage(combinedText);
    });

  const summary = includesForbiddenFieldOrderLanguage(payload.summary)
    ? payload.fallbackSummary
    : normalizeAiMessageContent(payload.summary) || payload.fallbackSummary;

  return {
    summary,
    findings,
  };
}

async function runAnalysisTool(payload: {
  toolName: OrchestratorToolDefinition["name"];
  displayName: string;
  purpose: string;
  fallbackSummary: string;
  extraRules?: string[];
  userInstruction: string;
  context: Parameters<OrchestratorToolDefinition["execute"]>[0];
}) {
  console.info("Resumeow analysis tool: retrieval started", {
    toolName: payload.toolName,
    resumeId: payload.context.state.baseResume.id,
  });
  const { sources, selectedJobDescription } = await retrieveSupportingContext(
    payload.context.supabase,
    {
      userId: payload.context.userId,
      activeResume: buildWorkingResume(
        payload.context.state.baseResume,
        payload.context.state.workingResumeData
      ),
      profile: payload.context.state.profile,
      query: payload.userInstruction,
      selectedJobDescriptionId: payload.context.state.selectedJobDescriptionId,
    }
  );

  payload.context.state.selectedJobDescription = selectedJobDescription;

  console.info("Resumeow analysis tool: retrieval completed", {
    toolName: payload.toolName,
    sources: sources.length,
    selectedJobDescription: selectedJobDescription?.title ?? null,
  });

  const content = await requestStructuredJsonContent({
    prompt: buildAnalysisToolPrompt({
      toolName: payload.toolName,
      purpose: payload.purpose,
      userInstruction: payload.userInstruction,
      resume: buildWorkingResume(
        payload.context.state.baseResume,
        payload.context.state.workingResumeData
      ),
      profile: payload.context.state.profile,
      jobDescription: selectedJobDescription,
      contextBlock: buildToolContextBlock(sources),
      extraRules: payload.extraRules,
    }),
    emptyResponseError: `${payload.displayName} returned an empty response. Please try again.`,
    modelBucket: "analysis",
    logLabel: `Resumeow analysis tool ${payload.toolName}`,
  });

  console.info("Resumeow analysis tool: parsing structured response", {
    toolName: payload.toolName,
  });
  const parsed = parseStructuredJson(content, analysisResultSchema);
  const sanitized = sanitizeAnalysisPayload({
    summary: parsed.summary,
    findings: parsed.findings.map((finding) => ({
      ...finding,
      citations: mapCitationIds(finding.citation_ids, sources),
    })),
    fallbackSummary: payload.fallbackSummary,
  });

  console.info("Resumeow analysis tool: completed", {
    toolName: payload.toolName,
    findings: sanitized.findings.length,
    score: parsed.score,
  });

  return {
    toolName: payload.toolName,
    toolDisplayName: payload.displayName,
    summary: sanitized.summary,
    citations: sanitized.findings.flatMap((finding) => finding.citations),
    data: {
      findings: sanitized.findings,
      score: parsed.score,
      selectedJobDescription,
    },
    mutatedResume: false,
  };
}

export const analysisToolDefinitions: Array<
  OrchestratorToolDefinition<Record<string, unknown>>
> = [
  {
    name: "review_resume_overall",
    displayName: "Review Resume Overall",
    description:
      "Review the current resume holistically and identify the highest-impact improvements.",
    category: "analysis",
    mutating: false,
    parameters: {
      type: "object",
      properties: {
        focus: {
          type: "string",
          description: "What to focus the review on.",
        },
      },
      required: ["focus"],
      additionalProperties: false,
    },
    buildStepLabel: () =>
      "Reviewing the current resume against your request and grounded context...",
    execute(context, args) {
      return runAnalysisTool({
        toolName: "review_resume_overall",
        displayName: "Review Resume Overall",
        purpose:
          "Review the active resume overall and identify the highest-impact content, clarity, impact, tailoring, and formatting improvements.",
        fallbackSummary:
          "Reviewed the resume overall and identified grounded improvement opportunities.",
        userInstruction:
          typeof args.focus === "string" && args.focus.trim()
            ? args.focus
            : context.state.latestUserMessage,
        context,
      });
    },
  },
  {
    name: "check_resume_against_job",
    displayName: "Check Resume Against Job",
    description:
      "Compare the active resume against the currently selected job context and identify gaps or alignment strengths.",
    category: "analysis",
    mutating: false,
    parameters: {
      type: "object",
      properties: {
        focus: {
          type: "string",
          description: "What to compare against the target job context.",
        },
      },
      required: ["focus"],
      additionalProperties: false,
    },
    buildStepLabel: () => "Comparing the resume against the selected job context...",
    execute(context, args) {
      return runAnalysisTool({
        toolName: "check_resume_against_job",
        displayName: "Check Resume Against Job",
        purpose:
          "Compare the active resume against the selected job description and highlight alignment strengths, missing emphasis, and factual tailoring opportunities.",
        fallbackSummary:
          "Checked the resume against the target job context and identified grounded alignment gaps and strengths.",
        extraRules: [
          "If there is no selected job description, say that clearly and do not pretend one exists.",
        ],
        userInstruction:
          typeof args.focus === "string" && args.focus.trim()
            ? args.focus
            : context.state.latestUserMessage,
        context,
      });
    },
  },
  {
    name: "find_weak_bullets",
    displayName: "Find Weak Bullets",
    description:
      "Identify weak or underpowered bullets in the current resume that could be improved.",
    category: "analysis",
    mutating: false,
    parameters: {
      type: "object",
      properties: {
        focus: {
          type: "string",
        },
      },
      required: ["focus"],
      additionalProperties: false,
    },
    buildStepLabel: () => "Identifying weak bullets that can be strengthened...",
    execute(context, args) {
      return runAnalysisTool({
        toolName: "find_weak_bullets",
        displayName: "Find Weak Bullets",
        purpose:
          "Find bullets that are vague, low-impact, repetitive, or weakly tailored.",
        fallbackSummary:
          "Identified grounded bullet-writing opportunities in the current resume.",
        userInstruction:
          typeof args.focus === "string" && args.focus.trim()
            ? args.focus
            : context.state.latestUserMessage,
        context,
      });
    },
  },
  {
    name: "suggest_missing_content",
    displayName: "Suggest Missing Content",
    description:
      "Identify important missing context or missing resume content that the user may need to add.",
    category: "analysis",
    mutating: false,
    parameters: {
      type: "object",
      properties: {
        focus: {
          type: "string",
        },
      },
      required: ["focus"],
      additionalProperties: false,
    },
    buildStepLabel: () => "Checking for missing content that would strengthen the resume...",
    execute(context, args) {
      return runAnalysisTool({
        toolName: "suggest_missing_content",
        displayName: "Suggest Missing Content",
        purpose:
          "Suggest missing content areas, evidence gaps, or absent context that the user could add without inventing anything.",
        fallbackSummary:
          "Identified missing context and content gaps that should be clarified or added.",
        userInstruction:
          typeof args.focus === "string" && args.focus.trim()
            ? args.focus
            : context.state.latestUserMessage,
        context,
      });
    },
  },
  {
    name: "detect_repetition_or_wordiness",
    displayName: "Detect Repetition Or Wordiness",
    description:
      "Detect repetitive phrasing, filler, or wordy bullets that should be tightened.",
    category: "analysis",
    mutating: false,
    parameters: {
      type: "object",
      properties: {
        focus: {
          type: "string",
        },
      },
      required: ["focus"],
      additionalProperties: false,
    },
    buildStepLabel: () => "Checking for repetition and wordiness in the current draft...",
    execute(context, args) {
      return runAnalysisTool({
        toolName: "detect_repetition_or_wordiness",
        displayName: "Detect Repetition Or Wordiness",
        purpose:
          "Find repeated wording, redundancy, filler, and overly long bullets in the active resume.",
        fallbackSummary:
          "Detected repetition and wordiness patterns that can be improved.",
        userInstruction:
          typeof args.focus === "string" && args.focus.trim()
            ? args.focus
            : context.state.latestUserMessage,
        context,
      });
    },
  },
  {
    name: "validate_factual_consistency",
    displayName: "Validate Factual Consistency",
    description:
      "Validate that the active resume remains consistent with the saved profile and retrieved evidence.",
    category: "analysis",
    mutating: false,
    parameters: {
      type: "object",
      properties: {
        focus: {
          type: "string",
        },
      },
      required: ["focus"],
      additionalProperties: false,
    },
    buildStepLabel: () => "Validating the resume against your saved evidence for factual consistency...",
    execute(context, args) {
      return runAnalysisTool({
        toolName: "validate_factual_consistency",
        displayName: "Validate Factual Consistency",
        purpose:
          "Validate factual consistency between the current resume, profile, job context, and retrieved evidence.",
        fallbackSummary:
          "Validated the resume against the available evidence for factual consistency.",
        userInstruction:
          typeof args.focus === "string" && args.focus.trim()
            ? args.focus
            : context.state.latestUserMessage,
        context,
      });
    },
  },
  {
    name: "check_format_constraints",
    displayName: "Check Format Constraints",
    description:
      "Check whether the active resume respects Resumeow's formatting and structural constraints.",
    category: "analysis",
    mutating: false,
    parameters: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
    buildStepLabel: () => "Checking Resumeow format constraints...",
    execute(context) {
      return runAnalysisTool({
        toolName: "check_format_constraints",
        displayName: "Check Format Constraints",
        purpose:
          "Check whether the active resume respects Resumeow's structural and formatting constraints, including required field completeness and section ordering rules.",
        fallbackSummary:
          "Checked the active resume against Resumeow's formatting and structural constraints.",
        extraRules: [
          "Focus on Resumeow's structure and formatting behavior rather than generic resume design advice.",
        ],
        userInstruction: "Check the current resume against Resumeow's format constraints.",
        context,
      });
    },
  },
  {
    name: "score_ats_alignment",
    displayName: "Score ATS Alignment",
    description:
      "Estimate ATS alignment against the selected target role and explain the score.",
    category: "analysis",
    mutating: false,
    parameters: {
      type: "object",
      properties: {
        focus: {
          type: "string",
        },
      },
      required: ["focus"],
      additionalProperties: false,
    },
    buildStepLabel: () => "Scoring ATS alignment against the target role...",
    execute(context, args) {
      return runAnalysisTool({
        toolName: "score_ats_alignment",
        displayName: "Score ATS Alignment",
        purpose:
          "Score ATS alignment for the current resume against the selected target role and explain the main drivers of the score.",
        fallbackSummary:
          "Scored the resume's ATS alignment using the available target-role context.",
        extraRules: [
          "Provide a realistic score from 0 to 100.",
        ],
        userInstruction:
          typeof args.focus === "string" && args.focus.trim()
            ? args.focus
            : context.state.latestUserMessage,
        context,
      });
    },
  },
];
