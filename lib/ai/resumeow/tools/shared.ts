import { randomUUID } from "crypto";
import { z } from "zod";
import {
  createChatCompletionForModel,
  getChatModelCandidates,
} from "@/lib/ai/resumeow/openrouter";
import type {
  OpenRouterFailureClass,
  OpenRouterModelBucket,
} from "@/lib/ai/resumeow/openrouter";
import {
  extractJsonFromText,
  normalizeAiMessageContent,
  splitCommaSeparated,
} from "@/lib/ai/resumeow/utils";
import {
  type ResumeCitation,
  type ResumeData,
  type ResumePatchOperation,
  type ResumeProfile,
  type ResumeSectionId,
  type SavedResume,
} from "@/lib/types/resume";
import { normalizeSectionOrder } from "@/lib/resume-data";

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

export type StructuredOutputFailureClass =
  | OpenRouterFailureClass
  | "empty_content"
  | "invalid_json"
  | "schema_validation_failed";

export interface StructuredOutputAttemptDiagnostic {
  model: string;
  isFallback: boolean;
  attemptNumber: number;
  strictMode: boolean;
  durationMs: number;
  contentLength: number;
  failureClass?: StructuredOutputFailureClass;
  errorMessage?: string;
}

export class StructuredOutputExhaustedError extends Error {
  readonly toolName: string;
  readonly toolDisplayName: string;
  readonly attempts: StructuredOutputAttemptDiagnostic[];
  readonly dominantFailureClass: StructuredOutputFailureClass | null;

  constructor(payload: {
    toolName: string;
    toolDisplayName: string;
    attempts: StructuredOutputAttemptDiagnostic[];
    dominantFailureClass: StructuredOutputFailureClass | null;
  }) {
    const failureDescription =
      payload.dominantFailureClass === "empty_content"
        ? "returned empty responses"
        : payload.dominantFailureClass === "invalid_json"
          ? "returned invalid JSON"
          : payload.dominantFailureClass === "schema_validation_failed"
            ? "returned JSON that did not match the expected schema"
            : payload.dominantFailureClass === "rate_limited"
              ? "hit provider rate limits"
              : payload.dominantFailureClass === "timeout_or_abort"
                ? "timed out before completing"
                : "failed to return a usable response";

    super(
      `${payload.toolDisplayName} ${failureDescription} after ${
        payload.attempts.length
      } attempt${payload.attempts.length === 1 ? "" : "s"}. Please try again.`
    );
    this.name = "StructuredOutputExhaustedError";
    this.toolName = payload.toolName;
    this.toolDisplayName = payload.toolDisplayName;
    this.attempts = payload.attempts;
    this.dominantFailureClass = payload.dominantFailureClass;
  }
}

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

function getDominantFailureClass(
  attempts: StructuredOutputAttemptDiagnostic[]
): StructuredOutputFailureClass | null {
  const counts = new Map<StructuredOutputFailureClass, number>();

  attempts.forEach((attempt) => {
    if (!attempt.failureClass) {
      return;
    }

    counts.set(
      attempt.failureClass,
      (counts.get(attempt.failureClass) ?? 0) + 1
    );
  });

  let winner: StructuredOutputFailureClass | null = null;
  let highestCount = -1;
  for (const [failureClass, count] of counts.entries()) {
    if (count > highestCount) {
      winner = failureClass;
      highestCount = count;
    }
  }

  return winner;
}

function getRetryPlannerNote(payload: {
  failureClass: StructuredOutputFailureClass;
  nextAction: "retry_same_model" | "switch_model";
}) {
  if (payload.nextAction === "retry_same_model") {
    if (payload.failureClass === "empty_content") {
      return "The model returned an empty response. Retrying with a stricter structured request...";
    }

    if (payload.failureClass === "invalid_json") {
      return "The model returned invalid JSON. Retrying with a stricter structured request...";
    }

    if (payload.failureClass === "schema_validation_failed") {
      return "The model returned output in the wrong shape. Retrying with a stricter structured request...";
    }

    if (payload.failureClass === "rate_limited") {
      return "That model hit a rate limit. Retrying this step with another configured path...";
    }

    return "That model failed to return a usable result. Retrying this step...";
  }

  if (payload.failureClass === "rate_limited") {
    return "Still working. Switching to a backup model for this step because the previous one was rate limited...";
  }

  return "Still working. Switching to a backup model for this step...";
}

function classifyStructuredOutputFailure(error: unknown): StructuredOutputFailureClass {
  if (error instanceof z.ZodError) {
    return "schema_validation_failed";
  }

  if (error instanceof Error) {
    if (error.message === "Empty JSON payload") {
      return "empty_content";
    }

    if (error instanceof SyntaxError) {
      return "invalid_json";
    }
  }

  return "provider_http_error";
}

async function parseStructuredContent<T>(
  content: string,
  schema: z.ZodSchema<T>
): Promise<T> {
  return schema.parse(JSON.parse(extractJsonFromText(content)));
}

export async function requestStructuredOutput<T>(payload: {
  prompt: string;
  toolName: string;
  toolDisplayName: string;
  schema: z.ZodSchema<T>;
  modelBucket: OpenRouterModelBucket;
  logLabel?: string;
  onProgress?: (label: string) => Promise<void> | void;
  createChatCompletionImpl?: typeof createChatCompletionForModel;
  modelCandidates?: Array<{
    model: string;
    isFallback: boolean;
  }>;
}) {
  const logLabel = payload.logLabel ?? "Resumeow structured JSON request";
  const createCompletion =
    payload.createChatCompletionImpl ?? createChatCompletionForModel;
  const modelCandidates =
    payload.modelCandidates ?? getChatModelCandidates(payload.modelBucket);
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
  const attempts: StructuredOutputAttemptDiagnostic[] = [];

  for (let modelIndex = 0; modelIndex < modelCandidates.length; modelIndex += 1) {
    const candidate = modelCandidates[modelIndex];

    for (let attemptNumber = 1; attemptNumber <= 2; attemptNumber += 1) {
      const strictMode = modelIndex > 0 || attemptNumber === 2;
      const startedAt = Date.now();

      try {
        const response = await createCompletion({
          model: candidate.model,
          messages: buildMessages(
            strictMode
              ? "Return only valid JSON using the exact schema requested above. Do not leave the response empty."
              : undefined
          ),
          toolChoice: "none",
          temperature: strictMode ? 0 : 0.2,
          modelBucket: payload.modelBucket,
          requestLabel: logLabel,
          isFallback: candidate.isFallback,
        });

        const content = extractTextContent(
          (response as { choices?: Array<{ message?: unknown }> }).choices?.[0]
            ?.message
        ).trim();

        if (!content) {
          const diagnostic: StructuredOutputAttemptDiagnostic = {
            model: candidate.model,
            isFallback: candidate.isFallback,
            attemptNumber,
            strictMode,
            durationMs: Date.now() - startedAt,
            contentLength: 0,
            failureClass: "empty_content",
            errorMessage: "The model returned an empty response.",
          };
          attempts.push(diagnostic);

          console.warn(`${logLabel}: empty model response`, diagnostic);

          const hasRetryOnSameModel = attemptNumber === 1;
          const hasAnotherModel = modelIndex < modelCandidates.length - 1;
          if (hasRetryOnSameModel || hasAnotherModel) {
            await payload.onProgress?.(
              getRetryPlannerNote({
                failureClass: "empty_content",
                nextAction: hasRetryOnSameModel
                  ? "retry_same_model"
                  : "switch_model",
              })
            );
          }
          continue;
        }

        const parsed = await parseStructuredContent(content, payload.schema);
        const diagnostic: StructuredOutputAttemptDiagnostic = {
          model: candidate.model,
          isFallback: candidate.isFallback,
          attemptNumber,
          strictMode,
          durationMs: Date.now() - startedAt,
          contentLength: content.length,
        };
        attempts.push(diagnostic);

        console.info(`${logLabel}: structured output succeeded`, diagnostic);
        return {
          parsed,
          attempts,
          resolvedModel: candidate.model,
        };
      } catch (error) {
        const failureClass =
          error instanceof Error &&
          error.message === "The model returned an empty response."
            ? "empty_content"
            : classifyStructuredOutputFailure(error);
        const diagnostic: StructuredOutputAttemptDiagnostic = {
          model: candidate.model,
          isFallback: candidate.isFallback,
          attemptNumber,
          strictMode,
          durationMs: Date.now() - startedAt,
          contentLength: 0,
          failureClass,
          errorMessage: error instanceof Error ? error.message : "Unknown error",
        };
        attempts.push(diagnostic);

        console.warn(`${logLabel}: structured output attempt failed`, diagnostic);

        const hasRetryOnSameModel =
          attemptNumber === 1 &&
          (failureClass === "empty_content" ||
            failureClass === "invalid_json" ||
            failureClass === "schema_validation_failed");
        const hasAnotherModel = modelIndex < modelCandidates.length - 1;

        if (hasRetryOnSameModel || hasAnotherModel) {
          await payload.onProgress?.(
            getRetryPlannerNote({
              failureClass,
              nextAction: hasRetryOnSameModel
                ? "retry_same_model"
                : "switch_model",
            })
          );
          continue;
        }
      }
    }
  }

  const dominantFailureClass = getDominantFailureClass(attempts);
  console.error(`${logLabel}: structured output attempts exhausted`, {
    toolName: payload.toolName,
    toolDisplayName: payload.toolDisplayName,
    dominantFailureClass,
    attempts,
  });

  throw new StructuredOutputExhaustedError({
    toolName: payload.toolName,
    toolDisplayName: payload.toolDisplayName,
    attempts,
    dominantFailureClass,
  });
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
