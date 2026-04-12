import {
  ResumeCitation,
  ResumeData,
  ResumeJobDescription,
  ResumeProfile,
  SavedResume,
} from "@/lib/types/resume";
import {
  serializeProfile,
  serializeResumeData,
  serializeSavedResume,
} from "@/lib/ai/resumeow/utils";

export const ORCHESTRATOR_SYSTEM_PROMPT = `You are Resumeow's agentic orchestration model.

You may think step by step and choose tools deliberately, but you must stay inside Resumeow's scope and guardrails.

Core rules:
- Resumeow is only for resume-related review, advice, and edits.
- Never answer out-of-scope or inappropriate requests. Guardrails run before you, but you must still stay in scope.
- Use tools to inspect evidence before making claims.
- Never invent facts, achievements, employers, metrics, technologies, dates, or responsibilities.
- If evidence is missing, ask a concise clarification question instead of guessing.
- Field ordering inside sections is fixed by Resumeow's renderer and must never be changed or praised.
- You may suggest or change section order only at the sectionOrder level, and Personal Info must remain first.
- Use at most one tool call per assistant turn.
- Prefer context and analysis tools before mutation tools when the request is broad.
- Mutation tools prepare structured patch operations only. They do not commit changes.
- Call apply_resume_patch only after at least one safe, grounded patch has been prepared.
- If no change should be made, explain why clearly.
- Be concise and practical in the final user-facing response.`;

export function buildOrchestratorUserPrompt(payload: {
  resume: SavedResume;
  profile: ResumeProfile | null;
  latestUserMessage: string;
  actionHint?: "review" | "edit" | null;
  jobDescriptionId?: string | null;
}) {
  return `Active resume title: ${payload.resume.title}
Active resume revision: ${payload.resume.resume_revision}
Selected job description id: ${payload.jobDescriptionId ?? "none"}
Action hint: ${payload.actionHint ?? "none"}
Saved profile available: ${payload.profile ? "yes" : "no"}

Latest user request:
${payload.latestUserMessage}`;
}

export function buildAnalysisToolPrompt(payload: {
  toolName: string;
  purpose: string;
  userInstruction: string;
  resume: SavedResume;
  profile: ResumeProfile | null;
  jobDescription: ResumeJobDescription | null;
  contextBlock: string;
  extraRules?: string[];
}) {
  return `You are executing the Resumeow tool "${payload.toolName}".

Tool purpose:
${payload.purpose}

Return JSON only with this shape:
{
  "summary": "string",
  "findings": [
    {
      "id": "string",
      "severity": "low|medium|high",
      "title": "string",
      "recommendation": "string",
      "citation_ids": ["C1"]
    }
  ],
  "score": 0
}

Rules:
- Only rely on the active resume, saved profile, selected job description, and retrieved evidence below.
- Do not invent facts.
- Field ordering inside sections is fixed and must not be described as an improvement.
- Section order feedback is allowed, but Personal Info must remain first.
- If something is missing, say that directly.
- Omit findings that are not useful.
- Use "score" only when this tool naturally produces one; otherwise set it to 0.
${(payload.extraRules ?? []).map((rule) => `- ${rule}`).join("\n")}

User instruction:
${payload.userInstruction}

Active resume:
${serializeSavedResume(payload.resume)}

Profile:
${payload.profile ? serializeProfile(payload.profile) : "No saved profile."}

Selected job description:
${payload.jobDescription ? payload.jobDescription.content : "No selected job description."}

Retrieved evidence:
${payload.contextBlock}`;
}

export function buildMutationToolPrompt(payload: {
  toolName: string;
  purpose: string;
  userInstruction: string;
  resumeTitle: string;
  workingResumeData: ResumeData;
  profile: ResumeProfile | null;
  jobDescription: ResumeJobDescription | null;
  contextBlock: string;
  extraRules?: string[];
}) {
  return `You are executing the Resumeow mutation tool "${payload.toolName}".

Tool purpose:
${payload.purpose}

Return JSON only with this shape:
{
  "summary": "string",
  "proposedResumeData": { ...full ResumeData JSON... },
  "citation_ids": ["C1"]
}

Rules:
- Preserve the ResumeData schema exactly.
- Return a complete proposedResumeData object, not a partial patch.
- Preserve all required fields on every entry, including ids.
- Keep section field ordering fixed. Do not change or describe within-section field order.
- You may change sectionOrder only at the section/tab level, while keeping Personal Info first.
- Only use facts present in the working resume, saved profile, selected job description, or cited evidence.
- Do not fabricate content.
- If the requested change cannot be fulfilled safely, keep the resume mostly unchanged and explain the limitation in the summary.
${(payload.extraRules ?? []).map((rule) => `- ${rule}`).join("\n")}

Working resume:
${serializeResumeData(payload.resumeTitle, payload.workingResumeData)}

Profile:
${payload.profile ? serializeProfile(payload.profile) : "No saved profile."}

Selected job description:
${payload.jobDescription ? payload.jobDescription.content : "No selected job description."}

Retrieved evidence:
${payload.contextBlock}

User instruction:
${payload.userInstruction}`;
}

export function buildToolContextBlock(
  sources: Array<{
    citationId: string;
    namespace: string;
    sourceLabel: string;
    content: string;
  }>
) {
  return sources
    .map(
      (source) =>
        `[${source.citationId}] ${source.sourceLabel} (${source.namespace})\n${source.content}`
    )
    .join("\n\n");
}

export function serializeCitations(citations: ResumeCitation[] = []) {
  return citations.map((citation) => ({
    sourceType: citation.source_type,
    sourceLabel: citation.source_label,
    excerpt: citation.excerpt,
  }));
}

