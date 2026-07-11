import { z } from "zod";
import { buildMutationToolPrompt, buildToolContextBlock } from "@/lib/ai/resumeow/orchestrator/prompts";
import { OrchestratorToolDefinition } from "@/lib/ai/resumeow/orchestrator/types";
import { retrieveSupportingContext } from "@/lib/ai/resumeow/rag";
import {
  createReplaceResumePatchOperation,
  mapCitationIds,
  normalizeProposedResumeData,
  requestStructuredOutput,
  resumeDataSchema,
} from "@/lib/ai/resumeow/tools/shared";
import {
  buildSafeChangeSummary,
  diffResumeData,
  normalizeAiMessageContent,
  sanitizeChangeSummary,
} from "@/lib/ai/resumeow/utils";

const mutationResultSchema = z.object({
  summary: z.string(),
  proposedResumeData: resumeDataSchema,
  citation_ids: z.array(z.string()).default([]),
});

async function runMutationTool(payload: {
  toolName: OrchestratorToolDefinition["name"];
  displayName: string;
  purpose: string;
  instruction: string;
  extraRules?: string[];
  context: Parameters<OrchestratorToolDefinition["execute"]>[0];
}) {
  console.info("Resumeow mutation tool: retrieval started", {
    toolName: payload.toolName,
    resumeId: payload.context.state.baseResume.id,
  });
  const { sources, selectedJobDescription } = await retrieveSupportingContext(
    payload.context.supabase,
    {
      userId: payload.context.userId,
      activeResume: {
        ...payload.context.state.baseResume,
        resume_data: payload.context.state.workingResumeData,
      },
      profile: payload.context.state.profile,
      query: payload.instruction,
      selectedJobDescriptionId: payload.context.state.selectedJobDescriptionId,
    }
  );

  payload.context.state.selectedJobDescription = selectedJobDescription;

  console.info("Resumeow mutation tool: retrieval completed", {
    toolName: payload.toolName,
    sources: sources.length,
    selectedJobDescription: selectedJobDescription?.title ?? null,
  });

  const { parsed } = await requestStructuredOutput({
    prompt: buildMutationToolPrompt({
      toolName: payload.toolName,
      purpose: payload.purpose,
      userInstruction: payload.instruction,
      resumeTitle: payload.context.state.baseResume.title,
      workingResumeData: payload.context.state.workingResumeData,
      profile: payload.context.state.profile,
      jobDescription: selectedJobDescription,
      contextBlock: buildToolContextBlock(sources),
      extraRules: payload.extraRules,
    }),
    toolName: payload.toolName,
    toolDisplayName: payload.displayName,
    schema: mutationResultSchema,
    modelBucket: "mutation",
    logLabel: `Resumeow mutation tool ${payload.toolName}`,
    onProgress: async (label) => {
      await payload.context.notifyProgress?.({
        label,
        phase: "apply",
      });
    },
  });

  console.info("Resumeow mutation tool: parsing structured response", {
    toolName: payload.toolName,
  });
  const proposedResumeData = normalizeProposedResumeData(
    parsed.proposedResumeData,
    payload.context.state.workingResumeData
  );
  const diffItems = diffResumeData(
    payload.context.state.workingResumeData,
    proposedResumeData
  );
  const safeSummary = sanitizeChangeSummary(parsed.summary, diffItems);
  const citations = mapCitationIds(parsed.citation_ids, sources);

  console.info("Resumeow mutation tool: diff computed", {
    toolName: payload.toolName,
    diffItems: diffItems.length,
    citations: citations.length,
  });

  if (diffItems.length === 0) {
    const noMaterialChangeSummary = buildSafeChangeSummary(diffItems);

    if (safeSummary && safeSummary !== noMaterialChangeSummary) {
      console.warn(
        "Resumeow mutation tool: model summary claimed changes but diff was empty",
        {
          toolName: payload.toolName,
          modelSummary: safeSummary,
        }
      );
    }

    console.info("Resumeow mutation tool: no material changes detected", {
      toolName: payload.toolName,
    });
    return {
      toolName: payload.toolName,
      toolDisplayName: payload.displayName,
      summary: noMaterialChangeSummary,
      citations,
      data: {
        diffItems,
      },
      mutatedResume: false,
    };
  }

  payload.context.state.workingResumeData = proposedResumeData;
  console.info("Resumeow mutation tool: updated working resume data in memory", {
    toolName: payload.toolName,
  });

  const patchOperation = createReplaceResumePatchOperation({
    resumeData: proposedResumeData,
    summary: safeSummary || buildSafeChangeSummary(diffItems),
    reason: payload.instruction,
    citations,
  });

  console.info("Resumeow mutation tool: prepared patch operation", {
    toolName: payload.toolName,
  });

  return {
    toolName: payload.toolName,
    toolDisplayName: payload.displayName,
    summary: normalizeAiMessageContent(
      safeSummary || buildSafeChangeSummary(diffItems)
    ),
    citations,
    data: {
      diffItems,
      proposedResumeData,
    },
    patchOperations: [patchOperation],
    diffItems,
    mutatedResume: false,
  };
}

export const mutationToolDefinitions: Array<
  OrchestratorToolDefinition<Record<string, unknown>>
> = [
  {
    name: "rewrite_bullet",
    displayName: "Rewrite Bullet",
    description:
      "Rewrite one or more resume bullets to be sharper, clearer, and more relevant while staying truthful.",
    category: "mutation",
    mutating: false,
    parameters: {
      type: "object",
      properties: {
        instruction: {
          type: "string",
          description: "What bullet rewrite should be made.",
        },
        entryId: {
          type: "string",
          description: "Optional resume entry id to target.",
        },
      },
      required: ["instruction"],
      additionalProperties: false,
    },
    buildStepLabel: () => "Rewriting weak bullets into grounded, sharper versions...",
    execute(context, args) {
      const instruction =
        typeof args.instruction === "string" && args.instruction.trim()
          ? args.instruction
          : context.state.latestUserMessage;
      const entryHint =
        typeof args.entryId === "string" && args.entryId.trim()
        ? `Focus on the entry with id "${args.entryId}" if it exists.`
        : "Choose the most relevant bullets based on the user's request and current evidence.";

      return runMutationTool({
        toolName: "rewrite_bullet",
        displayName: "Rewrite Bullet",
        purpose:
          "Rewrite specific bullets in the current resume so they are clearer, stronger, and more tailored without changing the facts.",
        instruction,
        extraRules: [
          entryHint,
          "Prefer improving wording and emphasis over broad structural changes unless the user explicitly asks for them.",
        ],
        context,
      });
    },
  },
  {
    name: "improve_summary_section",
    displayName: "Improve Summary Section",
    description:
      "Improve the resume's summary-like opening content if one exists in the current schema; otherwise return a safe no-op.",
    category: "mutation",
    mutating: false,
    parameters: {
      type: "object",
      properties: {
        instruction: {
          type: "string",
        },
      },
      required: ["instruction"],
      additionalProperties: false,
    },
    buildStepLabel: () => "Checking whether a summary-style opening section can be improved...",
    execute(context, args) {
      return runMutationTool({
        toolName: "improve_summary_section",
        displayName: "Improve Summary Section",
        purpose:
          "Improve any summary-like opening content if present, while preserving the current ResumeData schema.",
        instruction:
          typeof args.instruction === "string" && args.instruction.trim()
            ? args.instruction
            : context.state.latestUserMessage,
        extraRules: [
          "Do not invent a brand new resume field or schema key for a summary section.",
          "If this resume format has no dedicated summary section, keep the data unchanged and explain that limitation in the summary.",
        ],
        context,
      });
    },
  },
  {
    name: "tailor_resume_to_job",
    displayName: "Tailor Resume To Job",
    description:
      "Tailor the resume to the selected target job context while staying grounded in the user's existing evidence.",
    category: "mutation",
    mutating: false,
    parameters: {
      type: "object",
      properties: {
        instruction: {
          type: "string",
        },
      },
      required: ["instruction"],
      additionalProperties: false,
    },
    buildStepLabel: () => "Tailoring the active resume to the target job context...",
    execute(context, args) {
      return runMutationTool({
        toolName: "tailor_resume_to_job",
        displayName: "Tailor Resume To Job",
        purpose:
          "Tailor the current resume to the selected job description by re-emphasizing relevant evidence, rewriting bullets, and improving section order where justified.",
        instruction:
          typeof args.instruction === "string" && args.instruction.trim()
            ? args.instruction
            : context.state.latestUserMessage,
        extraRules: [
          "Use the selected job description automatically when one is available.",
          "Do not fabricate missing technologies, metrics, or job responsibilities.",
        ],
        context,
      });
    },
  },
  {
    name: "reorder_resume_sections",
    displayName: "Reorder Resume Sections",
    description:
      "Adjust the resume's section order to improve flow or relevance while keeping Personal Info first.",
    category: "mutation",
    mutating: false,
    parameters: {
      type: "object",
      properties: {
        instruction: {
          type: "string",
        },
      },
      required: ["instruction"],
      additionalProperties: false,
    },
    buildStepLabel: () => "Reordering resume sections for a stronger flow...",
    execute(context, args) {
      return runMutationTool({
        toolName: "reorder_resume_sections",
        displayName: "Reorder Resume Sections",
        purpose:
          "Adjust only the sectionOrder of the current resume to improve the narrative flow and target-role relevance.",
        instruction:
          typeof args.instruction === "string" && args.instruction.trim()
            ? args.instruction
            : context.state.latestUserMessage,
        extraRules: [
          "Only change sectionOrder unless the user explicitly asked for content edits too.",
          "Personal Info must remain first.",
        ],
        context,
      });
    },
  },
];
