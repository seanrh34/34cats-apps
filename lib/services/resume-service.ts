import { createClient } from "@/lib/supabase/client";
import { ResumeData } from "@/lib/types/resume";

export interface SavedResume {
  id: string;
  user_id: string;
  title: string;
  resume_data: ResumeData;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch all resumes for the current user
 */
export async function fetchUserResumes(): Promise<SavedResume[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("resumes")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching resumes:", error);
    throw error;
  }

  return data || [];
}

/**
 * Fetch a single resume by ID
 */
export async function fetchResume(id: string): Promise<SavedResume | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("resumes")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching resume:", error);
    throw error;
  }

  return data;
}

/**
 * Create a new resume
 */
export async function createResume(
  title: string,
  resumeData: ResumeData
): Promise<SavedResume> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("resumes")
    .insert({
      user_id: user.id,
      title,
      resume_data: resumeData,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating resume:", error);
    throw error;
  }

  return data;
}

/**
 * Update an existing resume
 */
export async function updateResume(
  id: string,
  title: string,
  resumeData: ResumeData
): Promise<SavedResume> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("resumes")
    .update({
      title,
      resume_data: resumeData,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating resume:", error);
    throw error;
  }

  return data;
}

/**
 * Delete a resume
 */
export async function deleteResume(id: string): Promise<void> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from("resumes")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting resume:", error);
    throw error;
  }
}

/**
 * Save resume (create if new, update if existing)
 */
export async function saveResume(
  resumeData: ResumeData,
  title: string,
  existingId?: string
): Promise<SavedResume> {
  if (existingId) {
    return updateResume(existingId, title, resumeData);
  } else {
    return createResume(title, resumeData);
  }
}
