import { refreshFreeModels } from "@/lib/ai/resumeow/openrouter";
import {
  OrchestratorEventWriter,
  OrchestratorState,
} from "@/lib/ai/resumeow/orchestrator/types";
import { enforceRateLimit } from "@/lib/ai/resumeow/rate-limit";
import { applyToolDefinition } from "@/lib/ai/resumeow/tools/apply";
import { trimResumeToOnePageToolDefinition } from "@/lib/ai/resumeow/tools/mutation";
import { buildEditAssistantMessage } from "@/lib/ai/resumeow/utils";
import { compileLatexToPDF, countPdfPages } from "@/lib/latex/compile";
import { generateLatexResume } from "@/lib/latex/template";
import { insertAiMessage } from "@/lib/services/resume-server-service";
import {
  ResumeData,
  ResumeProfile,
  SavedResume,
} from "@/lib/types/resume";
import { SupabaseClient } from "@supabase/supabase-js";

const MAX_TRIM_ATTEMPTS = 2;

async function measurePageCount(resumeData: ResumeData) {
  const pdf = await compileLatexToPDF(generateLatexResume(resumeData));
  return countPdfPages(pdf);
}

async function assertWithinRateLimit(
  supabase: SupabaseClient,
  userId: string,
  action: "mutation_tools" | "apply_resume_patch"
) {
  const limit = await enforceRateLimit(supabase, userId, action);
  if (!limit.allowed) {
    throw Object.assign(new Error("Rate limit exceeded — try again later."), {
      status: 429,
      rateLimit: limit,
    });
  }
}

/**
 * Standalone, user-triggered flow: compile the resume, and if it exceeds one
 * page, have the AI condense it (up to MAX_TRIM_ATTEMPTS passes) and apply
 * the result as a normal undoable change set.
 */
export async function runTrimResumeToOnePage(payload: {
  supabase: SupabaseClient;
  userId: string;
  resume: SavedResume;
  profile: ResumeProfile | null;
  latestUserMessage: string;
  writer: OrchestratorEventWriter;
}) {
  const { supabase, userId, writer } = payload;
  const runId = crypto.randomUUID();

  const state: OrchestratorState = {
    runId,
    latestUserMessage: payload.latestUserMessage,
    actionHint: "edit",
    baseResume: payload.resume,
    workingResumeData: payload.resume.resume_data,
    profile: payload.profile,
    selectedJobDescriptionId: null,
    selectedJobDescription: null,
    toolResults: [],
    pendingPatchOperations: [],
    latestAppliedResult: null,
  };

  const toolContext = {
    supabase,
    userId,
    state,
    notifyProgress: async (progress: { label: string; phase?: "planning" | "context" | "reasoning" | "apply" }) => {
      await writer.write("planner_note", {
        label: progress.label,
        phase: progress.phase ?? "reasoning",
      });
    },
  };

  const finish = async (content: string, metadata?: Record<string, unknown>) => {
    const assistantMessage = await insertAiMessage(supabase, {
      userId,
      resumeId: payload.resume.id,
      role: "assistant",
      content,
      metadata: {
        orchestration: { runId, kind: "final" },
        ...metadata,
      },
    });
    await writer.write("token", { text: content });
    await writer.write("assistant_done", { message: assistantMessage });
  };

  await refreshFreeModels();

  // Initial page count.
  await writer.write("tool_start", {
    stepNumber: 1,
    toolName: "check_page_fit",
    toolDisplayName: "Check Page Fit",
    stepLabel: "Compiling your resume to count its PDF pages...",
    phase: "reasoning",
    mutating: false,
  });

  let initialPageCount: number;
  try {
    initialPageCount = await measurePageCount(state.workingResumeData);
  } catch (error) {
    console.error("Resumeow trim: initial compile failed", error);
    await finish(
      "I couldn't compile your resume to check its length. Please make sure the required fields are filled in and try again."
    );
    return;
  }

  await writer.write("tool_result", {
    stepNumber: 1,
    stepLabel: "Page count measured.",
    phase: "reasoning",
    toolName: "check_page_fit",
    toolDisplayName: "Check Page Fit",
    summary: `The resume currently compiles to ${initialPageCount} page${initialPageCount === 1 ? "" : "s"}.`,
    mutating: false,
  });

  if (initialPageCount <= 1) {
    await finish(
      "Good news — your resume already fits on one page. No trimming was needed."
    );
    return;
  }

  // Condense, re-measure, repeat.
  let pageCount = initialPageCount;
  for (let attempt = 1; attempt <= MAX_TRIM_ATTEMPTS && pageCount > 1; attempt += 1) {
    await assertWithinRateLimit(supabase, userId, "mutation_tools");

    await writer.write("tool_start", {
      stepNumber: attempt + 1,
      toolName: trimResumeToOnePageToolDefinition.name,
      toolDisplayName: trimResumeToOnePageToolDefinition.displayName,
      stepLabel:
        attempt === 1
          ? "Condensing the resume so it fits on a single page..."
          : "Still over one page — trimming further...",
      phase: "apply",
      mutating: false,
    });

    const result = await trimResumeToOnePageToolDefinition.execute(toolContext, {
      instruction: `The resume currently compiles to ${pageCount} PDF pages but must fit on exactly 1 page.${
        attempt > 1
          ? " A previous trim pass was not enough — condense more aggressively this time."
          : ""
      } Tighten and trim while keeping every key fact.`,
    });

    state.toolResults.push(result);
    if (result.patchOperations?.length) {
      state.pendingPatchOperations.push(...result.patchOperations);
    }

    await writer.write("tool_result", {
      stepNumber: attempt + 1,
      stepLabel: "Trim pass complete.",
      phase: "apply",
      toolName: result.toolName,
      toolDisplayName: result.toolDisplayName,
      summary: result.summary,
      diffItems: result.diffItems,
      mutating: false,
    });

    if ((result.diffItems?.length ?? 0) === 0) {
      break;
    }

    await writer.write("planner_note", {
      label: "Recompiling the trimmed draft to verify the new page count...",
      phase: "reasoning",
    });

    try {
      pageCount = await measurePageCount(state.workingResumeData);
    } catch (error) {
      console.error("Resumeow trim: recompile failed", error);
      break;
    }
  }

  if (state.pendingPatchOperations.length === 0) {
    await finish(
      `Your resume compiles to ${initialPageCount} pages, but I couldn't find safe trims to make automatically. Try shortening long bullets or removing less relevant entries manually.`
    );
    return;
  }

  if (pageCount >= initialPageCount) {
    await finish(
      `Your resume compiles to ${initialPageCount} pages and my trim passes didn't reduce that, so I left it unchanged. Try removing less relevant entries manually.`
    );
    return;
  }

  // The trim helped (ideally fits one page now) — apply it as an undoable change set.
  await assertWithinRateLimit(supabase, userId, "apply_resume_patch");

  await writer.write("tool_start", {
    stepNumber: state.toolResults.length + 2,
    toolName: applyToolDefinition.name,
    toolDisplayName: applyToolDefinition.displayName,
    stepLabel: "Applying the trimmed resume as an undoable change...",
    phase: "apply",
    mutating: true,
  });

  const applied = await applyToolDefinition.execute(toolContext, {
    reason: "Trim the resume to fit on one PDF page.",
  });
  state.toolResults.push(applied);

  await writer.write("tool_result", {
    stepNumber: state.toolResults.length + 1,
    stepLabel: "Trimmed resume applied.",
    phase: "apply",
    toolName: applied.toolName,
    toolDisplayName: applied.toolDisplayName,
    summary: applied.summary,
    changeSet: applied.changeSet,
    diffItems: applied.diffItems,
    updatedResume: applied.updatedResume,
    mutating: true,
  });

  const outcome =
    pageCount <= 1
      ? `Done — your resume now fits on one page (was ${initialPageCount}).`
      : `I trimmed your resume from ${initialPageCount} to ${pageCount} pages. It still exceeds one page — run Fit to 1 Page again or trim a little manually.`;

  await finish(
    buildEditAssistantMessage({
      summary: `${outcome}\n\n${applied.summary}`,
      diffItems: applied.diffItems ?? [],
    }),
    {
      changeSet: applied.changeSet,
      diffItems: applied.diffItems,
    }
  );
}
