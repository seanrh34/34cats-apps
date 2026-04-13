import { chunkText } from "@/lib/ai/resumeow/chunking";
import { INTERNAL_RESUME_GUIDES } from "@/lib/ai/resumeow/internal-guides";
import { createEmbeddings } from "@/lib/ai/resumeow/openrouter";
import {
  buildProfileDocument,
  flattenResumeForText,
  toVectorString,
} from "@/lib/ai/resumeow/utils";
import { RETRIEVAL_LIMITS } from "@/lib/ai/resumeow/constants";
import {
  countRagDocumentsForNamespace,
  getRagDocumentBySourceKey,
  getJobDescriptionById,
  listUserResumes,
  replaceRagChunks,
  searchRagChunks,
  upsertRagDocument,
} from "@/lib/services/resume-server-service";
import {
  RagChunk,
  RagNamespace,
  ResumeJobDescription,
  ResumeProfile,
  SavedResume,
} from "@/lib/types/resume";
import { SupabaseClient } from "@supabase/supabase-js";

export interface RetrievedSource {
  citationId: string;
  namespace: RagNamespace | "active_resume";
  sourceLabel: string;
  content: string;
  documentId?: string;
  chunkId?: string;
}

async function embedChunksIfPossible(chunks: string[]) {
  try {
    return await createEmbeddings(chunks);
  } catch (error) {
    console.error("Failed to embed chunks", error);
    return chunks.map(() => null);
  }
}

export async function syncProfileToRag(
  supabase: SupabaseClient,
  userId: string,
  profile: ResumeProfile
) {
  const content = buildProfileDocument(profile);
  const document = await upsertRagDocument(supabase, {
    userId,
    namespace: "user_profile_docs",
    sourceType: "resume_profile",
    sourceId: profile.id,
    sourceKey: `profile:${userId}`,
    title: "Resumeow AI Profile",
    content,
    metadata: {
      profileId: profile.id,
    },
  });

  const chunks = chunkText(content);
  const embeddings = await embedChunksIfPossible(chunks);

  await replaceRagChunks(
    supabase,
    document.id,
    chunks.map((chunk, index) => ({
      userId,
      namespace: "user_profile_docs",
      content: chunk,
      chunkIndex: index,
      embedding: embeddings[index] ? toVectorString(embeddings[index]!) : null,
      metadata: {
        sourceKey: document.source_key,
      },
    }))
  );
}

export async function syncResumeToRag(
  supabase: SupabaseClient,
  resume: SavedResume
) {
  const content = flattenResumeForText(resume);
  const document = await upsertRagDocument(supabase, {
    userId: resume.user_id,
    resumeId: resume.id,
    namespace: "user_resume_history",
    sourceType: "resume",
    sourceId: resume.id,
    sourceKey: `resume:${resume.id}`,
    title: resume.title,
    content,
    metadata: {
      revision: resume.resume_revision,
    },
  });

  const chunks = chunkText(content);
  const embeddings = await embedChunksIfPossible(chunks);

  await replaceRagChunks(
    supabase,
    document.id,
    chunks.map((chunk, index) => ({
      userId: resume.user_id,
      resumeId: resume.id,
      namespace: "user_resume_history",
      content: chunk,
      chunkIndex: index,
      embedding: embeddings[index] ? toVectorString(embeddings[index]!) : null,
      metadata: {
        sourceKey: document.source_key,
        title: resume.title,
        revision: resume.resume_revision,
      },
    }))
  );
}

export async function syncJobDescriptionToRag(
  supabase: SupabaseClient,
  jobDescription: ResumeJobDescription
) {
  const content = [
    `Title: ${jobDescription.title}`,
    `Company: ${jobDescription.company || "N/A"}`,
    `Role: ${jobDescription.role || "N/A"}`,
    "",
    jobDescription.content,
  ].join("\n");

  const document = await upsertRagDocument(supabase, {
    userId: jobDescription.user_id,
    namespace: "job_descriptions",
    sourceType: "job_description",
    sourceId: jobDescription.id,
    sourceKey: `job-description:${jobDescription.id}`,
    title: jobDescription.title,
    content,
    metadata: {
      company: jobDescription.company,
      role: jobDescription.role,
    },
  });

  const chunks = chunkText(content);
  const embeddings = await embedChunksIfPossible(chunks);

  await replaceRagChunks(
    supabase,
    document.id,
    chunks.map((chunk, index) => ({
      userId: jobDescription.user_id,
      namespace: "job_descriptions",
      content: chunk,
      chunkIndex: index,
      embedding: embeddings[index] ? toVectorString(embeddings[index]!) : null,
      metadata: {
        sourceKey: document.source_key,
        title: jobDescription.title,
      },
    }))
  );
}

export async function ensureInternalGuidesSeeded(
  supabase: SupabaseClient
) {
  const count = await countRagDocumentsForNamespace(
    supabase,
    "internal_resume_guides"
  );

  if (count > 0) {
    return;
  }

  for (const guide of INTERNAL_RESUME_GUIDES) {
    const document = await upsertRagDocument(supabase, {
      namespace: "internal_resume_guides",
      sourceType: "internal_guide",
      sourceId: guide.sourceKey,
      sourceKey: guide.sourceKey,
      title: guide.title,
      content: guide.content,
      metadata: {},
    });

    const chunks = chunkText(guide.content, 500, 80);
    const embeddings = await embedChunksIfPossible(chunks);

    await replaceRagChunks(
      supabase,
      document.id,
      chunks.map((chunk, index) => ({
        namespace: "internal_resume_guides",
        content: chunk,
        chunkIndex: index,
        embedding: embeddings[index] ? toVectorString(embeddings[index]!) : null,
        metadata: {
          sourceKey: guide.sourceKey,
          title: guide.title,
        },
      }))
    );
  }
}

export async function ensureUserResumeHistoryIndexed(
  supabase: SupabaseClient,
  userId: string
) {
  const resumes = await listUserResumes(supabase, userId);
  for (const resume of resumes) {
    const existingDocument = await getRagDocumentBySourceKey(
      supabase,
      `resume:${resume.id}`
    );
    const existingRevision =
      typeof existingDocument?.metadata?.revision === "number"
        ? existingDocument.metadata.revision
        : null;

    if (existingRevision === resume.resume_revision) {
      continue;
    }

    await syncResumeToRag(supabase, resume);
  }
}

function dedupeChunks(chunks: RagChunk[]) {
  const seen = new Set<string>();
  return chunks.filter((chunk) => {
    const key = `${chunk.document_id}:${chunk.chunk_index}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export async function retrieveSupportingContext(
  supabase: SupabaseClient,
  payload: {
    userId: string;
    activeResume: SavedResume;
    profile: ResumeProfile | null;
    query: string;
    selectedJobDescriptionId?: string | null;
  }
) {
  console.info("Resumeow RAG: retrieveSupportingContext started", {
    userId: payload.userId,
    resumeId: payload.activeResume.id,
    selectedJobDescriptionId: payload.selectedJobDescriptionId ?? null,
    queryPreview: payload.query.slice(0, 160),
  });
  const sources: RetrievedSource[] = [];

  sources.push({
    citationId: "C0",
    namespace: "active_resume",
    sourceLabel: `Active resume: ${payload.activeResume.title}`,
    content: flattenResumeForText(payload.activeResume),
  });

  if (payload.profile) {
    sources.push({
      citationId: "C1",
      namespace: "user_profile_docs",
      sourceLabel: "Saved AI profile",
      content: buildProfileDocument(payload.profile),
    });
  }

  let selectedJobDescription: ResumeJobDescription | null = null;
  if (payload.selectedJobDescriptionId) {
    console.info("Resumeow RAG: loading selected job description", {
      selectedJobDescriptionId: payload.selectedJobDescriptionId,
    });
    selectedJobDescription = await getJobDescriptionById(
      supabase,
      payload.userId,
      payload.selectedJobDescriptionId
    );

    if (selectedJobDescription) {
      console.info("Resumeow RAG: selected job description loaded", {
        title: selectedJobDescription.title,
      });
      sources.push({
        citationId: `C${sources.length}`,
        namespace: "job_descriptions",
        sourceLabel: `Selected job description: ${selectedJobDescription.title}`,
        content: selectedJobDescription.content,
        documentId: selectedJobDescription.id,
      });
    }
  }

  try {
    console.info("Resumeow RAG: creating query embedding");
    const [queryEmbedding] = await createEmbeddings([payload.query]);
    if (queryEmbedding) {
      const namespaceOrder: RagNamespace[] = [
        "user_resume_history",
        "job_descriptions",
        "internal_resume_guides",
        "user_profile_docs",
      ];

      for (const namespace of namespaceOrder) {
        console.info("Resumeow RAG: searching namespace", {
          namespace,
          matchCount: RETRIEVAL_LIMITS[namespace],
        });
        const matches = dedupeChunks(
          await searchRagChunks(supabase, {
            embedding: toVectorString(queryEmbedding),
            userId: payload.userId,
            resumeId: null,
            namespace,
            matchCount: RETRIEVAL_LIMITS[namespace],
          })
        );

        console.info("Resumeow RAG: namespace search complete", {
          namespace,
          matches: matches.length,
        });

        matches.forEach((match) => {
          if (
            namespace === "user_resume_history" &&
            match.resume_id === payload.activeResume.id
          ) {
            return;
          }

          sources.push({
            citationId: `C${sources.length}`,
            namespace,
            sourceLabel:
              typeof match.metadata?.title === "string"
                ? match.metadata.title
                : `${namespace} snippet`,
            content: match.content,
            documentId: match.document_id,
            chunkId: match.id,
          });
        });
      }
    }
  } catch (error) {
    console.error("Failed to retrieve semantic context", error);
  }

  if (!sources.some((source) => source.namespace === "internal_resume_guides")) {
    console.info("Resumeow RAG: injecting fallback internal guides");
    INTERNAL_RESUME_GUIDES.slice(0, 2).forEach((guide) => {
      sources.push({
        citationId: `C${sources.length}`,
        namespace: "internal_resume_guides",
        sourceLabel: guide.title,
        content: guide.content,
      });
    });
  }

  console.info("Resumeow RAG: retrieveSupportingContext completed", {
    totalSources: sources.length,
    selectedJobDescription: selectedJobDescription?.title ?? null,
  });
  return {
    sources,
    selectedJobDescription,
  };
}
