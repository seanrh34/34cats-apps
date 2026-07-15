import {
  buildProfileDocument,
  flattenResumeForText,
} from "@/lib/ai/resumeow/utils";
import {
  getJobDescriptionById,
  listUserResumes,
} from "@/lib/services/resume-server-service";
import {
  ResumeJobDescription,
  ResumeProfile,
  SavedResume,
} from "@/lib/types/resume";
import { SupabaseClient } from "@supabase/supabase-js";

export interface RetrievedSource {
  citationId: string;
  namespace:
    | "active_resume"
    | "user_profile_docs"
    | "job_descriptions"
    | "user_resume_history";
  sourceLabel: string;
  content: string;
  documentId?: string;
}

const MAX_HISTORY_RESUMES = 2;

// The whole per-user corpus (resume, profile, job description, a couple of
// prior resumes) is a few KB, so it is loaded whole and deterministically.
export async function retrieveSupportingContext(
  supabase: SupabaseClient,
  payload: {
    userId: string;
    activeResume: SavedResume;
    profile: ResumeProfile | null;
    selectedJobDescriptionId?: string | null;
    includeResumeHistory?: boolean;
  }
) {
  const sources: RetrievedSource[] = [
    {
      citationId: "C0",
      namespace: "active_resume",
      sourceLabel: `Active resume: ${payload.activeResume.title}`,
      content: flattenResumeForText(payload.activeResume),
    },
  ];

  if (payload.profile) {
    sources.push({
      citationId: `C${sources.length}`,
      namespace: "user_profile_docs",
      sourceLabel: "Saved AI profile",
      content: buildProfileDocument(payload.profile),
    });
  }

  let selectedJobDescription: ResumeJobDescription | null = null;
  if (payload.selectedJobDescriptionId) {
    selectedJobDescription = await getJobDescriptionById(
      supabase,
      payload.userId,
      payload.selectedJobDescriptionId
    );

    if (selectedJobDescription) {
      sources.push({
        citationId: `C${sources.length}`,
        namespace: "job_descriptions",
        sourceLabel: `Selected job description: ${selectedJobDescription.title}`,
        content: selectedJobDescription.content,
        documentId: selectedJobDescription.id,
      });
    }
  }

  if (payload.includeResumeHistory) {
    const resumes = await listUserResumes(supabase, payload.userId);
    resumes
      .filter((resume) => resume.id !== payload.activeResume.id)
      .slice(0, MAX_HISTORY_RESUMES)
      .forEach((resume) => {
        sources.push({
          citationId: `C${sources.length}`,
          namespace: "user_resume_history",
          sourceLabel: `Prior resume: ${resume.title}`,
          content: flattenResumeForText(resume),
        });
      });
  }

  return {
    sources,
    selectedJobDescription,
  };
}
