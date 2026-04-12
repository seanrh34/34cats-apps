import {
  ResumeAiToolName,
  ResumeAiToolResult,
  ResumeData,
  ResumeJobDescription,
  ResumePatchOperation,
  ResumeProfile,
  SavedResume,
} from "@/lib/types/resume";
import { SupabaseClient } from "@supabase/supabase-js";

export interface OrchestratorConversationMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_call_id?: string;
  tool_calls?: Array<{
    id: string;
    type: "function";
    function: {
      name: string;
      arguments: string;
    };
  }>;
}

export interface OrchestratorEventWriter {
  write(event: string, data: unknown): Promise<void>;
}

export interface OrchestratorState {
  runId: string;
  latestUserMessage: string;
  actionHint?: "review" | "edit" | null;
  baseResume: SavedResume;
  workingResumeData: ResumeData;
  profile: ResumeProfile | null;
  selectedJobDescriptionId?: string | null;
  selectedJobDescription?: ResumeJobDescription | null;
  toolResults: ResumeAiToolResult[];
  pendingPatchOperations: ResumePatchOperation[];
  latestAppliedResult?: ResumeAiToolResult | null;
}

export interface OrchestratorToolExecutionContext {
  supabase: SupabaseClient;
  userId: string;
  state: OrchestratorState;
}

export interface OrchestratorToolDefinition<TArgs = Record<string, unknown>> {
  name: ResumeAiToolName;
  displayName: string;
  description: string;
  category: "context" | "analysis" | "mutation" | "apply";
  mutating: boolean;
  parameters: Record<string, unknown>;
  buildStepLabel: (args: TArgs, state: OrchestratorState) => string;
  execute: (
    context: OrchestratorToolExecutionContext,
    args: TArgs
  ) => Promise<ResumeAiToolResult>;
}

