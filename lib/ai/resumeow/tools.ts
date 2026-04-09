import { z } from "zod";
import { randomUUID } from "crypto";
import {
  createChangeSet,
  getJobDescriptionById,
  saveResumeForUser,
  updateChangeSetStatus,
} from "@/lib/services/resume-server-service";
import { createChatCompletion } from "@/lib/ai/resumeow/openrouter";
import {
  buildChangePrompt,
  buildReviewPrompt,
} from "@/lib/ai/resumeow/prompts";
import {
  diffResumeData,
  extractJsonFromText,
} from "@/lib/ai/resumeow/utils";
import { retrieveSupportingContext, syncResumeToRag } from "@/lib/ai/resumeow/rag";
import {
  ResumeData,
  ResumeCitation,
  ResumeProfile,
  SavedResume,
} from "@/lib/types/resume";
import { SupabaseClient } from "@supabase/supabase-js";

const personalInfoSchema = z.object({
  fullName: z.string(),
  email: z.string(),
  phone: z.string(),
  linkedin: z.string().optional(),
  github: z.string().optional(),
  website: z.string().optional(),
});

const experienceSchema = z.object({
  id: z.string(),
  position: z.string(),
  dateRange: z.string(),
  company: z.string(),
  location: z.string(),
  description: z.array(z.string()),
});

const educationSchema = z.object({
  id: z.string(),
  institution: z.string(),
  location: z.string(),
  degree: z.string(),
  gpa: z.string().optional(),
  dateRange: z.string(),
});

const skillSchema = z.object({
  category: z.string(),
  items: z.array(z.string()),
});

const projectSchema = z.object({
  id: z.string(),
  name: z.string(),
  link: z.string().optional(),
});

const activitySchema = z.object({
  id: z.string(),
  position: z.string(),
  dateRange: z.string(),
  organization: z.string(),
  location: z.string(),
  description: z.array(z.string()),
});

const resumeDataSchema = z.object({
  personalInfo: personalInfoSchema,
  education: z.array(educationSchema),
  experience: z.array(experienceSchema),
  coCurricularActivities: z.array(activitySchema).optional(),
  skills: z.array(skillSchema),
  projects: z.array(projectSchema).optional(),
});

const reviewSchema = z.object({
  summary: z.string(),
  findings: z.array(
    z.object({
      id: z.string(),
      category: z.enum(["content", "clarity", "impact", "tailoring", "format"]),
      severity: z.enum(["low", "medium", "high"]),
      title: z.string(),
      rationale: z.string(),
      recommendation: z.string(),
      citation_ids: z.array(z.string()).default([]),
    })
  ),
});

const changeSchema = z.object({
  summary: z.string(),
  proposedResumeData: resumeDataSchema,
  citation_ids: z.array(z.string()).default([]),
});

function getObjectValue(
  value: unknown
): Record<string, unknown> | null {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return null;
}

function asString(value: unknown, fallback = "") {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return fallback;
}

function asOptionalString(value: unknown, fallback = "") {
  if (value === null || value === undefined) {
    return fallback;
  }

  return asString(value, fallback);
}

function asStringArray(value: unknown, fallback: string[] = []) {
  if (Array.isArray(value)) {
    return value
      .map((entry) => asString(entry).trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    const normalized = value
      .split(/\n|,/)
      .map((entry) => entry.trim())
      .filter(Boolean);
    return normalized.length > 0 ? normalized : fallback;
  }

  return fallback;
}

function normalizePersonalInfo(
  value: unknown,
  fallback: ResumeData["personalInfo"]
): ResumeData["personalInfo"] {
  const source = getObjectValue(value);

  return {
    fullName: asString(source?.fullName, fallback.fullName),
    email: asString(source?.email, fallback.email),
    phone: asString(source?.phone, fallback.phone),
    linkedin: asOptionalString(source?.linkedin, fallback.linkedin ?? ""),
    github: asOptionalString(source?.github, fallback.github ?? ""),
    website: asOptionalString(source?.website, fallback.website ?? ""),
  };
}

function normalizeEducation(
  value: unknown,
  fallback: ResumeData["education"]
): ResumeData["education"] {
  if (!Array.isArray(value)) {
    return fallback;
  }

  return value.map((entry, index) => {
    const source = getObjectValue(entry);
    const fallbackEntry = fallback[index];

    return {
      id: asString(source?.id, fallbackEntry?.id ?? randomUUID()),
      institution: asString(source?.institution, fallbackEntry?.institution ?? ""),
      location: asString(source?.location, fallbackEntry?.location ?? ""),
      degree: asString(source?.degree, fallbackEntry?.degree ?? ""),
      gpa: asOptionalString(source?.gpa, fallbackEntry?.gpa ?? ""),
      dateRange: asString(source?.dateRange, fallbackEntry?.dateRange ?? ""),
    };
  });
}

function normalizeExperience(
  value: unknown,
  fallback: ResumeData["experience"]
): ResumeData["experience"] {
  if (!Array.isArray(value)) {
    return fallback;
  }

  return value.map((entry, index) => {
    const source = getObjectValue(entry);
    const fallbackEntry = fallback[index];

    return {
      id: asString(source?.id, fallbackEntry?.id ?? randomUUID()),
      position: asString(source?.position, fallbackEntry?.position ?? ""),
      dateRange: asString(source?.dateRange, fallbackEntry?.dateRange ?? ""),
      company: asString(source?.company, fallbackEntry?.company ?? ""),
      location: asString(source?.location, fallbackEntry?.location ?? ""),
      description: asStringArray(
        source?.description,
        fallbackEntry?.description ?? []
      ),
    };
  });
}

function normalizeSkills(
  value: unknown,
  fallback: ResumeData["skills"]
): ResumeData["skills"] {
  if (!Array.isArray(value)) {
    return fallback;
  }

  if (value.every((entry) => typeof entry === "string")) {
    const items = asStringArray(value);
    if (items.length === 0) {
      return fallback;
    }

    return [
      {
        category: fallback[0]?.category || "Skills",
        items,
      },
    ];
  }

  return value
    .map((entry, index) => {
      const source = getObjectValue(entry);
      if (!source) {
        return null;
      }

      const fallbackEntry = fallback[index];

      return {
        category: asString(source.category, fallbackEntry?.category ?? ""),
        items: asStringArray(source.items, fallbackEntry?.items ?? []),
      };
    })
    .filter((entry): entry is ResumeData["skills"][number] => entry !== null);
}

function normalizeProjects(
  value: unknown,
  fallback: NonNullable<ResumeData["projects"]>
): NonNullable<ResumeData["projects"]> {
  if (!Array.isArray(value)) {
    return fallback;
  }

  return value.map((entry, index) => {
    const source = getObjectValue(entry);
    const fallbackEntry = fallback[index];

    return {
      id: asString(source?.id, fallbackEntry?.id ?? randomUUID()),
      name: asString(source?.name, fallbackEntry?.name ?? ""),
      link: asOptionalString(source?.link, fallbackEntry?.link ?? ""),
    };
  });
}

function normalizeActivities(
  value: unknown,
  fallback: NonNullable<ResumeData["coCurricularActivities"]>
): NonNullable<ResumeData["coCurricularActivities"]> {
  if (!Array.isArray(value)) {
    return fallback;
  }

  return value.map((entry, index) => {
    const source = getObjectValue(entry);
    const fallbackEntry = fallback[index];

    return {
      id: asString(source?.id, fallbackEntry?.id ?? randomUUID()),
      position: asString(source?.position, fallbackEntry?.position ?? ""),
      dateRange: asString(source?.dateRange, fallbackEntry?.dateRange ?? ""),
      organization: asString(
        source?.organization,
        fallbackEntry?.organization ?? ""
      ),
      location: asString(source?.location, fallbackEntry?.location ?? ""),
      description: asStringArray(
        source?.description,
        fallbackEntry?.description ?? []
      ),
    };
  });
}

function normalizeProposedResumeData(
  value: unknown,
  fallback: ResumeData
): ResumeData {
  const source = getObjectValue(value);

  return {
    personalInfo: normalizePersonalInfo(source?.personalInfo, fallback.personalInfo),
    education: normalizeEducation(source?.education, fallback.education),
    experience: normalizeExperience(source?.experience, fallback.experience),
    coCurricularActivities: normalizeActivities(
      source?.coCurricularActivities,
      fallback.coCurricularActivities ?? []
    ),
    skills: normalizeSkills(source?.skills, fallback.skills),
    projects: normalizeProjects(source?.projects, fallback.projects ?? []),
  };
}

function extractTextContent(message: unknown) {
  if (!message || typeof message !== "object") {
    return "";
  }

  const safeMessage = message as {
    content?: string | Array<{ text?: string }>;
  };

  if (typeof safeMessage.content === "string") {
    return safeMessage.content;
  }

  if (Array.isArray(safeMessage.content)) {
    return safeMessage.content
      .map((part) => part?.text ?? "")
      .filter(Boolean)
      .join("\n");
  }

  return "";
}

function mapCitationIds(
  citationIds: string[],
  sources: Array<{
    citationId: string;
    namespace: ResumeCitation["source_type"];
    sourceLabel: string;
    documentId?: string;
    chunkId?: string;
    content: string;
  }>
): ResumeCitation[] {
  return citationIds
    .map((citationId) => {
      const match = sources.find((source) => source.citationId === citationId);
      if (!match) {
        return null;
      }

      return {
        source_type: match.namespace,
        source_label: match.sourceLabel,
        document_id: match.documentId,
        chunk_id: match.chunkId,
        excerpt: match.content.slice(0, 220),
      } satisfies ResumeCitation;
    })
    .filter((value) => value !== null);
}

function buildContextBlock(
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

export async function runReviewResumeTool(payload: {
  supabase: SupabaseClient;
  userId: string;
  resume: SavedResume;
  profile: ResumeProfile | null;
  jobDescriptionId?: string | null;
  focus: string;
}) {
  const { sources, selectedJobDescription } = await retrieveSupportingContext(
    payload.supabase,
    {
      userId: payload.userId,
      activeResume: payload.resume,
      profile: payload.profile,
      query: payload.focus,
      selectedJobDescriptionId: payload.jobDescriptionId,
    }
  );

  const response = await createChatCompletion({
    messages: [
      {
        role: "system",
        content: buildReviewPrompt({
          resume: payload.resume,
          profile: payload.profile,
          jobDescription: selectedJobDescription,
          userInstruction: payload.focus,
          contextBlock: buildContextBlock(sources),
        }),
      },
    ],
    toolChoice: "none",
    temperature: 0.2,
  });

  const content = extractTextContent(response.choices?.[0]?.message);
  const parsed = reviewSchema.parse(JSON.parse(extractJsonFromText(content)));

  return {
    summary: parsed.summary,
    findings: parsed.findings.map((finding) => ({
      ...finding,
      citations: mapCitationIds(finding.citation_ids, sources),
    })),
    selectedJobDescription,
    citationsCatalog: sources,
  };
}

export async function runProposeResumeChangesTool(payload: {
  supabase: SupabaseClient;
  userId: string;
  resume: SavedResume;
  profile: ResumeProfile | null;
  jobDescriptionId?: string | null;
  instruction: string;
}) {
  const { sources, selectedJobDescription } = await retrieveSupportingContext(
    payload.supabase,
    {
      userId: payload.userId,
      activeResume: payload.resume,
      profile: payload.profile,
      query: payload.instruction,
      selectedJobDescriptionId: payload.jobDescriptionId,
    }
  );

  const response = await createChatCompletion({
    messages: [
      {
        role: "system",
        content: buildChangePrompt({
          resume: payload.resume,
          profile: payload.profile,
          jobDescription: selectedJobDescription,
          userInstruction: payload.instruction,
          contextBlock: buildContextBlock(sources),
        }),
      },
    ],
    toolChoice: "none",
    temperature: 0.2,
  });

  const content = extractTextContent(response.choices?.[0]?.message);
  const rawParsed = JSON.parse(extractJsonFromText(content)) as Record<string, unknown>;
  const normalizedParsed = {
    ...rawParsed,
    proposedResumeData: normalizeProposedResumeData(
      rawParsed.proposedResumeData,
      payload.resume.resume_data
    ),
  };
  const parsed = changeSchema.parse(normalizedParsed);
  const diffItems = diffResumeData(
    payload.resume.resume_data,
    parsed.proposedResumeData
  );

  if (diffItems.length === 0) {
    return {
      summary:
        parsed.summary ||
        "No safe, material changes were applied to the current resume.",
      changeSet: null,
      diffItems,
      updatedResume: null,
      selectedJobDescription,
    };
  }

  const changeSet = await createChangeSet(payload.supabase, {
    userId: payload.userId,
    resumeId: payload.resume.id,
    baseResumeRevision: payload.resume.resume_revision,
    prompt: payload.instruction,
    summary: parsed.summary,
    previousResumeData: payload.resume.resume_data,
    proposedResumeData: parsed.proposedResumeData,
    diffItems: diffItems as unknown as Record<string, unknown>[],
    citations: mapCitationIds(parsed.citation_ids, sources) as unknown as Record<
      string,
      unknown
    >[],
  });

  const updatedResume = await saveResumeForUser(
    payload.supabase,
    payload.userId,
    payload.resume.title,
    parsed.proposedResumeData,
    payload.resume.id
  );

  const appliedChangeSet = await updateChangeSetStatus(
    payload.supabase,
    payload.userId,
    changeSet.id,
    "applied"
  );
  await syncResumeToRag(payload.supabase, updatedResume);

  return {
    summary:
      parsed.summary ||
      "Applied grounded updates to the current resume.",
    changeSet: appliedChangeSet,
    diffItems,
    updatedResume,
    selectedJobDescription,
  };
}

export async function loadSelectedJobDescription(
  supabase: SupabaseClient,
  userId: string,
  jobDescriptionId?: string | null
) {
  if (!jobDescriptionId) {
    return null;
  }

  return getJobDescriptionById(supabase, userId, jobDescriptionId);
}
