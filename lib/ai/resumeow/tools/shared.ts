import { randomUUID } from "crypto";
import { z } from "zod";
import { createChatCompletion } from "@/lib/ai/resumeow/openrouter";
import {
  buildProfileDocument,
  extractJsonFromText,
  flattenResumeForText,
  normalizeAiMessageContent,
  splitCommaSeparated,
} from "@/lib/ai/resumeow/utils";
import {
  ResumeCitation,
  ResumeData,
  ResumePatchOperation,
  ResumeProfile,
  ResumeSectionId,
  SavedResume,
} from "@/lib/types/resume";
import { normalizeSectionOrder } from "@/lib/resume-data";
import { OpenRouterModelBucket } from "@/lib/ai/resumeow/openrouter";

export const resumeDataSchema = z.object({
  personalInfo: z.object({
    fullName: z.string(),
    email: z.string(),
    phone: z.string(),
    linkedin: z.string().optional(),
    github: z.string().optional(),
    website: z.string().optional(),
  }),
  education: z.array(
    z.object({
      id: z.string(),
      institution: z.string(),
      location: z.string(),
      degree: z.string(),
      gpa: z.string().optional(),
      dateRange: z.string(),
    })
  ),
  experience: z.array(
    z.object({
      id: z.string(),
      position: z.string(),
      dateRange: z.string(),
      company: z.string(),
      location: z.string(),
      description: z.array(z.string()),
    })
  ),
  coCurricularActivities: z
    .array(
      z.object({
        id: z.string(),
        position: z.string(),
        dateRange: z.string(),
        organization: z.string(),
        location: z.string(),
        description: z.array(z.string()),
      })
    )
    .optional(),
  skills: z.array(
    z.object({
      category: z.string(),
      items: z.array(z.string()),
    })
  ),
  projects: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        link: z.string().optional(),
        linkLabel: z.string().optional(),
        technologies: z.array(z.string()).optional(),
        description: z.array(z.string()).optional(),
      })
    )
    .optional(),
  certificationsAwards: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        description: z.string(),
      })
    )
    .optional(),
  sectionOrder: z
    .array(
      z.enum([
        "personal",
        "education",
        "experience",
        "cocurricular",
        "skills",
        "projects",
        "certificationsAwards",
      ])
    )
    .optional(),
});

export const analysisResultSchema = z.object({
  summary: z.string(),
  findings: z
    .array(
      z.object({
        id: z.string(),
        severity: z.enum(["low", "medium", "high"]),
        title: z.string(),
        recommendation: z.string(),
        citation_ids: z.array(z.string()).default([]),
      })
    )
    .default([]),
  score: z.number().min(0).max(100).default(0),
});

type JsonRecord = Record<string, unknown>;

function getObjectValue(value: unknown): JsonRecord | null {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as JsonRecord;
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
    const items = splitCommaSeparated(value);
    return items.length > 0 ? items : fallback;
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
) {
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
      linkLabel: asOptionalString(
        source?.linkLabel,
        fallbackEntry?.linkLabel ?? asString(source?.link, fallbackEntry?.link ?? "")
      ),
      technologies: asStringArray(
        source?.technologies,
        fallbackEntry?.technologies ?? []
      ),
      description: asStringArray(
        source?.description,
        fallbackEntry?.description ?? []
      ),
    };
  });
}

function normalizeActivities(
  value: unknown,
  fallback: NonNullable<ResumeData["coCurricularActivities"]>
) {
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

function normalizeCertificationsAwards(
  value: unknown,
  fallback: NonNullable<ResumeData["certificationsAwards"]>
) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  return value.map((entry, index) => {
    const source = getObjectValue(entry);
    const fallbackEntry = fallback[index];

    return {
      id: asString(source?.id, fallbackEntry?.id ?? randomUUID()),
      name: asString(source?.name, fallbackEntry?.name ?? ""),
      description: asString(
        source?.description,
        fallbackEntry?.description ?? ""
      ),
    };
  });
}

function normalizeResumeSectionOrder(
  value: unknown,
  fallback: ResumeSectionId[] | undefined
) {
  return normalizeSectionOrder(value ?? fallback ?? []);
}

export function normalizeProposedResumeData(
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
    certificationsAwards: normalizeCertificationsAwards(
      source?.certificationsAwards,
      fallback.certificationsAwards ?? []
    ),
    sectionOrder: normalizeResumeSectionOrder(
      source?.sectionOrder,
      fallback.sectionOrder
    ),
  };
}

export function extractTextContent(message: unknown) {
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

export async function requestStructuredJsonContent(payload: {
  prompt: string;
  emptyResponseError: string;
  modelBucket: OpenRouterModelBucket;
  logLabel?: string;
}) {
  const logLabel = payload.logLabel ?? "Resumeow structured JSON request";
  const buildMessages = (followUp?: string) =>
    [
      {
        role: "system" as const,
        content: payload.prompt,
      },
      ...(followUp
        ? [
            {
              role: "user" as const,
              content: followUp,
            },
          ]
        : []),
    ];

  console.info(`${logLabel}: requesting first model response`, {
    modelBucket: payload.modelBucket,
  });
  const firstResponse = await createChatCompletion({
    messages: buildMessages(),
    toolChoice: "none",
    temperature: 0.2,
    modelBucket: payload.modelBucket,
  });

  let content = extractTextContent(firstResponse.choices?.[0]?.message).trim();
  if (content) {
    console.info(`${logLabel}: received first model response`, {
      contentLength: content.length,
    });
    return content;
  }

  console.info(`${logLabel}: first response was empty, retrying`, {
    modelBucket: payload.modelBucket,
  });
  const retryResponse = await createChatCompletion({
    messages: buildMessages(
      "Return only valid JSON using the exact schema requested above. Do not leave the response empty."
    ),
    toolChoice: "none",
    temperature: 0,
    modelBucket: payload.modelBucket,
  });

  content = extractTextContent(retryResponse.choices?.[0]?.message).trim();
  if (content) {
    console.info(`${logLabel}: received retry model response`, {
      contentLength: content.length,
    });
    return content;
  }

  console.warn(`${logLabel}: both model responses were empty`);
  throw new Error(payload.emptyResponseError);
}

export function parseStructuredJson<T>(
  content: string,
  schema: z.ZodSchema<T>
) {
  return schema.parse(JSON.parse(extractJsonFromText(content)));
}

export function mapCitationIds(
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

export function buildWorkingResume(
  resume: SavedResume,
  resumeData: ResumeData
): SavedResume {
  return {
    ...resume,
    resume_data: resumeData,
  };
}

export function createReplaceResumePatchOperation(payload: {
  resumeData: ResumeData;
  summary: string;
  reason: string;
  citations?: ResumeCitation[];
}): ResumePatchOperation {
  return {
    type: "replace_resume_data",
    summary: normalizeAiMessageContent(payload.summary),
    reason: payload.reason,
    resume_data: payload.resumeData,
    citations: payload.citations ?? [],
  };
}

export function buildContextSummaryBlocks(payload: {
  activeResume: SavedResume;
  profile: ResumeProfile | null;
}) {
  return {
    activeResumeText: flattenResumeForText(payload.activeResume),
    profileText: payload.profile ? buildProfileDocument(payload.profile) : "",
  };
}
