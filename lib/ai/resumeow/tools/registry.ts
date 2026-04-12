import { OpenRouterTool } from "@/lib/ai/resumeow/openrouter";
import { OrchestratorToolDefinition } from "@/lib/ai/resumeow/orchestrator/types";
import { analysisToolDefinitions } from "@/lib/ai/resumeow/tools/analysis";
import { applyToolDefinition } from "@/lib/ai/resumeow/tools/apply";
import { contextToolDefinitions } from "@/lib/ai/resumeow/tools/context";
import { mutationToolDefinitions } from "@/lib/ai/resumeow/tools/mutation";
import { ResumeAiToolName } from "@/lib/types/resume";

export const resumeowToolDefinitions: Array<
  OrchestratorToolDefinition<Record<string, unknown>>
> = [
  ...contextToolDefinitions,
  ...analysisToolDefinitions,
  ...mutationToolDefinitions,
  applyToolDefinition,
];

const toolDefinitionMap = new Map<
  ResumeAiToolName,
  OrchestratorToolDefinition<Record<string, unknown>>
>(resumeowToolDefinitions.map((definition) => [definition.name, definition]));

export function getResumeowToolDefinition(name: string) {
  return toolDefinitionMap.get(name as ResumeAiToolName) ?? null;
}

export function getResumeowToolOpenRouterDefinitions(): OpenRouterTool[] {
  return resumeowToolDefinitions.map((definition) => ({
    type: "function",
    function: {
      name: definition.name,
      description: definition.description,
      parameters: definition.parameters,
    },
  }));
}
