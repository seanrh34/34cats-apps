import { SupabaseClient } from "@supabase/supabase-js";
import {
  RagChunk,
  RagDocument,
  ResumeAiMessage,
  ResumeChangeSet,
  ResumeData,
  ResumeJobDescription,
  ResumeProfile,
  SavedResume,
} from "@/lib/types/resume";

type JsonRecord = Record<string, unknown>;
type DatabaseClient = SupabaseClient;
type DatabaseRow = Record<string, unknown>;

function mapResumeRow(row: DatabaseRow): SavedResume {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    title: String(row.title),
    resume_data: row.resume_data as ResumeData,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    resume_revision: Number(row.revision ?? row.resume_revision ?? 1),
  };
}

function mapProfileRow(row: DatabaseRow): ResumeProfile {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    professional_headline: String(row.professional_headline ?? ""),
    target_roles: (row.target_roles as string[] | null) ?? [],
    years_experience:
      typeof row.years_experience === "number" ? row.years_experience : null,
    location_preferences: (row.location_preferences as string[] | null) ?? [],
    core_skills: (row.core_skills as string[] | null) ?? [],
    education_summary: String(row.education_summary ?? ""),
    domain_focus: (row.domain_focus as string[] | null) ?? [],
    achievement_notes: String(row.achievement_notes ?? ""),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function mapMessageRow(row: DatabaseRow): ResumeAiMessage {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    resume_id: String(row.resume_id),
    role: row.role as ResumeAiMessage["role"],
    content: String(row.content ?? ""),
    tool_name: row.tool_name ? String(row.tool_name) : null,
    tool_call_id: row.tool_call_id ? String(row.tool_call_id) : null,
    metadata: (row.metadata as JsonRecord | null) ?? null,
    created_at: String(row.created_at),
  };
}

function mapChangeSetRow(row: DatabaseRow): ResumeChangeSet {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    resume_id: String(row.resume_id),
    base_resume_revision: Number(row.base_resume_revision),
    prompt: String(row.prompt ?? ""),
    summary: String(row.summary ?? ""),
    status: row.status as ResumeChangeSet["status"],
    previous_resume_data: (row.previous_resume_data as ResumeData | null) ?? null,
    proposed_resume_data: row.proposed_resume_data as ResumeData,
    diff_items: (row.diff_items as ResumeChangeSet["diff_items"] | null) ?? [],
    citations: (row.citations as ResumeChangeSet["citations"] | null) ?? [],
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    applied_at: row.applied_at ? String(row.applied_at) : null,
  };
}

function mapJobDescriptionRow(row: DatabaseRow): ResumeJobDescription {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    title: String(row.title ?? ""),
    company: String(row.company ?? ""),
    role: String(row.role ?? ""),
    content: String(row.content ?? ""),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function mapRagDocumentRow(row: DatabaseRow): RagDocument {
  return {
    id: String(row.id),
    user_id: row.user_id ? String(row.user_id) : null,
    resume_id: row.resume_id ? String(row.resume_id) : null,
    namespace: row.namespace as RagDocument["namespace"],
    source_type: String(row.source_type),
    source_id: String(row.source_id),
    source_key: String(row.source_key),
    title: String(row.title ?? ""),
    content: String(row.content ?? ""),
    metadata: (row.metadata as JsonRecord | null) ?? null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function mapRagChunkRow(row: DatabaseRow): RagChunk {
  return {
    id: String(row.id),
    document_id: String(row.document_id),
    user_id: row.user_id ? String(row.user_id) : null,
    resume_id: row.resume_id ? String(row.resume_id) : null,
    namespace: row.namespace as RagChunk["namespace"],
    content: String(row.content ?? ""),
    chunk_index: Number(row.chunk_index ?? 0),
    metadata: (row.metadata as JsonRecord | null) ?? null,
    similarity:
      typeof row.similarity === "number" ? row.similarity : undefined,
  };
}

function assertNoError(
  error: { message?: string } | null,
  fallbackMessage: string
) {
  if (error) {
    console.error(fallbackMessage, error);
    throw new Error(error.message ?? fallbackMessage);
  }
}

export async function listUserResumes(
  supabase: DatabaseClient,
  userId: string
): Promise<SavedResume[]> {
  const { data, error } = await supabase
    .from("resumes")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  assertNoError(error, "Failed to list resumes");
  return ((data ?? []) as DatabaseRow[]).map(mapResumeRow);
}

export async function getResumeById(
  supabase: DatabaseClient,
  userId: string,
  resumeId: string
): Promise<SavedResume | null> {
  const { data, error } = await supabase
    .from("resumes")
    .select("*")
    .eq("user_id", userId)
    .eq("id", resumeId)
    .maybeSingle();

  assertNoError(error, "Failed to fetch resume");
  return data ? mapResumeRow(data as DatabaseRow) : null;
}

export async function saveResumeForUser(
  supabase: DatabaseClient,
  userId: string,
  title: string,
  resumeData: ResumeData,
  resumeId?: string
): Promise<SavedResume> {
  if (resumeId) {
    const { data, error } = await supabase
      .from("resumes")
      .update({
        title,
        resume_data: resumeData,
      })
      .eq("id", resumeId)
      .eq("user_id", userId)
      .select("*")
      .single();

    assertNoError(error, "Failed to update resume");
    return mapResumeRow(data as DatabaseRow);
  }

  const { data, error } = await supabase
    .from("resumes")
    .insert({
      user_id: userId,
      title,
      resume_data: resumeData,
    })
    .select("*")
    .single();

  assertNoError(error, "Failed to create resume");
  return mapResumeRow(data as DatabaseRow);
}

export async function deleteResumeForUser(
  supabase: DatabaseClient,
  userId: string,
  resumeId: string
) {
  const { error } = await supabase
    .from("resumes")
    .delete()
    .eq("id", resumeId)
    .eq("user_id", userId);

  assertNoError(error, "Failed to delete resume");
}

export async function getResumeProfile(
  supabase: DatabaseClient,
  userId: string
): Promise<ResumeProfile | null> {
  const { data, error } = await supabase
    .from("resume_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  assertNoError(error, "Failed to fetch profile");
  return data ? mapProfileRow(data as DatabaseRow) : null;
}

export async function saveResumeProfile(
  supabase: DatabaseClient,
  userId: string,
  payload: Omit<ResumeProfile, "id" | "user_id" | "created_at" | "updated_at">
): Promise<ResumeProfile> {
  const { data, error } = await supabase
    .from("resume_profiles")
    .upsert(
      {
        user_id: userId,
        ...payload,
      },
      {
        onConflict: "user_id",
      }
    )
    .select("*")
    .single();

  assertNoError(error, "Failed to save profile");
  return mapProfileRow(data as DatabaseRow);
}

export async function listAiMessages(
  supabase: DatabaseClient,
  userId: string,
  resumeId: string
): Promise<ResumeAiMessage[]> {
  const { data, error } = await supabase
    .from("resume_ai_messages")
    .select("*")
    .eq("user_id", userId)
    .eq("resume_id", resumeId)
    .order("created_at", { ascending: true });

  assertNoError(error, "Failed to fetch AI messages");
  return ((data ?? []) as DatabaseRow[]).map(mapMessageRow);
}

export async function insertAiMessage(
  supabase: DatabaseClient,
  input: {
    userId: string;
    resumeId: string;
    role: ResumeAiMessage["role"];
    content: string;
    toolName?: string | null;
    toolCallId?: string | null;
    metadata?: JsonRecord | null;
  }
): Promise<ResumeAiMessage> {
  const { data, error } = await supabase
    .from("resume_ai_messages")
    .insert({
      user_id: input.userId,
      resume_id: input.resumeId,
      role: input.role,
      content: input.content,
      tool_name: input.toolName ?? null,
      tool_call_id: input.toolCallId ?? null,
      metadata: input.metadata ?? {},
    })
    .select("*")
    .single();

  assertNoError(error, "Failed to insert AI message");
  return mapMessageRow(data as DatabaseRow);
}

export async function listChangeSets(
  supabase: DatabaseClient,
  userId: string,
  resumeId: string
): Promise<ResumeChangeSet[]> {
  const { data, error } = await supabase
    .from("resume_ai_change_sets")
    .select("*")
    .eq("user_id", userId)
    .eq("resume_id", resumeId)
    .order("created_at", { ascending: false });

  assertNoError(error, "Failed to list change sets");
  return ((data ?? []) as DatabaseRow[]).map(mapChangeSetRow);
}

export async function createChangeSet(
  supabase: DatabaseClient,
  input: {
    userId: string;
    resumeId: string;
    baseResumeRevision: number;
    prompt: string;
    summary: string;
    previousResumeData?: ResumeData | null;
    proposedResumeData: ResumeData;
    diffItems: JsonRecord[];
    citations: JsonRecord[];
    status?: ResumeChangeSet["status"];
  }
): Promise<ResumeChangeSet> {
  const { data, error } = await supabase
    .from("resume_ai_change_sets")
    .insert({
      user_id: input.userId,
      resume_id: input.resumeId,
      base_resume_revision: input.baseResumeRevision,
      prompt: input.prompt,
      summary: input.summary,
      previous_resume_data: input.previousResumeData ?? null,
      proposed_resume_data: input.proposedResumeData,
      diff_items: input.diffItems,
      citations: input.citations,
      status: input.status ?? "draft",
    })
    .select("*")
    .single();

  assertNoError(error, "Failed to create change set");
  return mapChangeSetRow(data as DatabaseRow);
}

export async function getChangeSetById(
  supabase: DatabaseClient,
  userId: string,
  changeSetId: string
): Promise<ResumeChangeSet | null> {
  const { data, error } = await supabase
    .from("resume_ai_change_sets")
    .select("*")
    .eq("user_id", userId)
    .eq("id", changeSetId)
    .maybeSingle();

  assertNoError(error, "Failed to get change set");
  return data ? mapChangeSetRow(data as DatabaseRow) : null;
}

export async function updateChangeSetStatus(
  supabase: DatabaseClient,
  userId: string,
  changeSetId: string,
  status: ResumeChangeSet["status"]
): Promise<ResumeChangeSet> {
  const payload: Record<string, unknown> = {
    status,
  };

  if (status === "applied") {
    payload.applied_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("resume_ai_change_sets")
    .update(payload)
    .eq("id", changeSetId)
    .eq("user_id", userId)
    .select("*")
    .single();

  assertNoError(error, "Failed to update change set");
  return mapChangeSetRow(data as DatabaseRow);
}

export async function listJobDescriptions(
  supabase: DatabaseClient,
  userId: string
): Promise<ResumeJobDescription[]> {
  const { data, error } = await supabase
    .from("resume_job_descriptions")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  assertNoError(error, "Failed to list job descriptions");
  return ((data ?? []) as DatabaseRow[]).map(mapJobDescriptionRow);
}

export async function countJobDescriptionsForUser(
  supabase: DatabaseClient,
  userId: string
): Promise<number> {
  const { count, error } = await supabase
    .from("resume_job_descriptions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  assertNoError(error, "Failed to count job descriptions");
  return count ?? 0;
}

export async function getJobDescriptionById(
  supabase: DatabaseClient,
  userId: string,
  jobDescriptionId: string
): Promise<ResumeJobDescription | null> {
  const { data, error } = await supabase
    .from("resume_job_descriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("id", jobDescriptionId)
    .maybeSingle();

  assertNoError(error, "Failed to fetch job description");
  return data ? mapJobDescriptionRow(data as DatabaseRow) : null;
}

export async function saveJobDescription(
  supabase: DatabaseClient,
  userId: string,
  payload: {
    id?: string;
    title: string;
    company: string;
    role: string;
    content: string;
  }
): Promise<ResumeJobDescription> {
  const upsertPayload = {
    ...(payload.id ? { id: payload.id } : {}),
    user_id: userId,
    title: payload.title,
    company: payload.company,
    role: payload.role,
    content: payload.content,
  };

  const { data, error } = await supabase
    .from("resume_job_descriptions")
    .upsert(upsertPayload)
    .select("*")
    .single();

  assertNoError(error, "Failed to save job description");
  return mapJobDescriptionRow(data as DatabaseRow);
}

export async function deleteJobDescription(
  supabase: DatabaseClient,
  userId: string,
  jobDescriptionId: string
) {
  const { error } = await supabase
    .from("resume_job_descriptions")
    .delete()
    .eq("id", jobDescriptionId)
    .eq("user_id", userId);

  assertNoError(error, "Failed to delete job description");
}

export async function upsertRagDocument(
  supabase: DatabaseClient,
  payload: {
    userId?: string | null;
    resumeId?: string | null;
    namespace: string;
    sourceType: string;
    sourceId: string;
    sourceKey: string;
    title: string;
    content: string;
    metadata?: JsonRecord | null;
  }
): Promise<RagDocument> {
  const { data, error } = await supabase
    .from("rag_documents")
    .upsert(
      {
        user_id: payload.userId ?? null,
        resume_id: payload.resumeId ?? null,
        namespace: payload.namespace,
        source_type: payload.sourceType,
        source_id: payload.sourceId,
        source_key: payload.sourceKey,
        title: payload.title,
        content: payload.content,
        metadata: payload.metadata ?? {},
      },
      {
        onConflict: "source_key",
      }
    )
    .select("*")
    .single();

  assertNoError(error, "Failed to upsert RAG document");
  return mapRagDocumentRow(data as DatabaseRow);
}

export async function getRagDocumentBySourceKey(
  supabase: DatabaseClient,
  sourceKey: string
): Promise<RagDocument | null> {
  const { data, error } = await supabase
    .from("rag_documents")
    .select("*")
    .eq("source_key", sourceKey)
    .maybeSingle();

  assertNoError(error, "Failed to fetch RAG document");
  return data ? mapRagDocumentRow(data as DatabaseRow) : null;
}

export async function deleteRagDocumentBySourceKey(
  supabase: DatabaseClient,
  sourceKey: string,
  userId?: string | null
) {
  let query = supabase.from("rag_documents").delete().eq("source_key", sourceKey);

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { error } = await query;
  assertNoError(error, "Failed to delete RAG document by source key");
}

export async function replaceRagChunks(
  supabase: DatabaseClient,
  documentId: string,
  chunks: Array<{
    userId?: string | null;
    resumeId?: string | null;
    namespace: string;
    content: string;
    chunkIndex: number;
    embedding?: string | null;
    metadata?: JsonRecord | null;
  }>
) {
  const { error: deleteError } = await supabase
    .from("rag_chunks")
    .delete()
    .eq("document_id", documentId);

  assertNoError(deleteError, "Failed to replace RAG chunks");

  if (chunks.length === 0) {
    return;
  }

  const { error } = await supabase.from("rag_chunks").insert(
    chunks.map((chunk) => ({
      document_id: documentId,
      user_id: chunk.userId ?? null,
      resume_id: chunk.resumeId ?? null,
      namespace: chunk.namespace,
      content: chunk.content,
      chunk_index: chunk.chunkIndex,
      embedding: chunk.embedding ?? null,
      metadata: chunk.metadata ?? {},
    }))
  );

  assertNoError(error, "Failed to insert RAG chunks");
}

export async function countRagDocumentsForNamespace(
  supabase: DatabaseClient,
  namespace: string
) {
  const { count, error } = await supabase
    .from("rag_documents")
    .select("id", { count: "exact", head: true })
    .eq("namespace", namespace);

  assertNoError(error, "Failed to count RAG documents");
  return count ?? 0;
}

export async function searchRagChunks(
  supabase: DatabaseClient,
  payload: {
    embedding: string;
    userId: string;
    resumeId?: string | null;
    namespace?: string;
    matchCount?: number;
  }
): Promise<RagChunk[]> {
  const { data, error } = await supabase.rpc("match_rag_chunks", {
    query_embedding: payload.embedding,
    filter_user_id: payload.userId,
    filter_resume_id: payload.resumeId ?? null,
    filter_namespace: payload.namespace ?? null,
    match_count: payload.matchCount ?? 6,
  });

  assertNoError(error, "Failed to search RAG chunks");
  return ((data ?? []) as DatabaseRow[]).map(mapRagChunkRow);
}
