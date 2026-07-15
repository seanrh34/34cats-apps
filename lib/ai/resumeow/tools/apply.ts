import {
  createChangeSet,
  saveResumeForUser,
  updateChangeSetStatus,
} from "@/lib/services/resume-server-service";
import { OrchestratorToolDefinition } from "@/lib/ai/resumeow/orchestrator/types";
import { diffResumeData } from "@/lib/ai/resumeow/utils";

export const applyToolDefinition: OrchestratorToolDefinition<{ reason?: string }> =
  {
    name: "apply_resume_patch",
    displayName: "Apply Resume Patch",
    description:
      "Commit the prepared grounded resume patches to the live active resume and create one undoable change set.",
    category: "apply",
    mutating: true,
    parameters: {
      type: "object",
      properties: {
        reason: {
          type: "string",
          description: "Optional reason for applying the prepared patch.",
        },
      },
      additionalProperties: false,
    },
    buildStepLabel: () => "Applying grounded updates to the active resume...",
    async execute({ supabase, userId, state }, args) {
      const latestPatch =
        state.pendingPatchOperations[state.pendingPatchOperations.length - 1];

      console.info("Resumeow apply tool: started", {
        resumeId: state.baseResume.id,
        pendingPatchOperations: state.pendingPatchOperations.length,
      });

      if (!latestPatch) {
        return {
          toolName: "apply_resume_patch",
          toolDisplayName: "Apply Resume Patch",
          summary: "No grounded resume patch is ready to apply yet.",
          data: {
            applied: false,
          },
          mutatedResume: false,
        };
      }

      const finalResumeData = latestPatch.resume_data;
      const diffItems = diffResumeData(state.baseResume.resume_data, finalResumeData);
      console.info("Resumeow apply tool: diff against live resume computed", {
        resumeId: state.baseResume.id,
        diffItems: diffItems.length,
      });
      if (diffItems.length === 0) {
        return {
          toolName: "apply_resume_patch",
          toolDisplayName: "Apply Resume Patch",
          summary: "There were no material changes to apply to the active resume.",
          data: {
            applied: false,
            diffItems,
          },
          mutatedResume: false,
        };
      }

      const summary = state.pendingPatchOperations
        .map((operation) => operation.summary)
        .filter(Boolean)
        .join("\n\n")
        .trim();
      const citations = state.pendingPatchOperations.flatMap(
        (operation) => operation.citations ?? []
      );

      console.info("Resumeow apply tool: creating change set", {
        resumeId: state.baseResume.id,
      });
      const changeSet = await createChangeSet(supabase, {
        userId,
        resumeId: state.baseResume.id,
        baseResumeRevision: state.baseResume.resume_revision,
        prompt: args.reason || state.latestUserMessage,
        summary,
        previousResumeData: state.baseResume.resume_data,
        proposedResumeData: finalResumeData,
        diffItems: diffItems as unknown as Record<string, unknown>[],
        citations: citations as unknown as Record<string, unknown>[],
      });

      console.info("Resumeow apply tool: saving updated resume", {
        resumeId: state.baseResume.id,
      });
      const updatedResume = await saveResumeForUser(
        supabase,
        userId,
        state.baseResume.title,
        finalResumeData,
        state.baseResume.id
      );
      console.info("Resumeow apply tool: marking change set as applied", {
        changeSetId: changeSet.id,
      });
      const appliedChangeSet = await updateChangeSetStatus(
        supabase,
        userId,
        changeSet.id,
        "applied"
      );

      state.workingResumeData = updatedResume.resume_data;

      console.info("Resumeow apply tool: completed", {
        resumeId: updatedResume.id,
        changeSetId: appliedChangeSet.id,
      });

      return {
        toolName: "apply_resume_patch",
        toolDisplayName: "Apply Resume Patch",
        summary:
          summary || "Applied the grounded updates to the active resume.",
        citations,
        data: {
          applied: true,
        },
        updatedResume,
        changeSet: appliedChangeSet,
        diffItems,
        mutatedResume: true,
      };
    },
  };
