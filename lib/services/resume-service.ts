import { ResumeData, SavedResume } from "@/lib/types/resume";

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error ?? "Request failed");
  }

  return response.json();
}

export async function fetchUserResumes(): Promise<SavedResume[]> {
  const response = await fetch("/api/resumeow/resumes", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  const payload = await parseResponse<{ resumes: SavedResume[] }>(response);
  return payload.resumes;
}

export async function fetchResume(id: string): Promise<SavedResume | null> {
  const response = await fetch(`/api/resumeow/resumes/${id}`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  const payload = await parseResponse<{ resume: SavedResume | null }>(response);
  return payload.resume;
}

export async function createResume(
  title: string,
  resumeData: ResumeData
): Promise<SavedResume> {
  const response = await fetch("/api/resumeow/resumes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      title,
      resumeData,
    }),
  });

  const payload = await parseResponse<{ resume: SavedResume }>(response);
  return payload.resume;
}

export async function updateResume(
  id: string,
  title: string,
  resumeData: ResumeData
): Promise<SavedResume> {
  const response = await fetch(`/api/resumeow/resumes/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      title,
      resumeData,
    }),
  });

  const payload = await parseResponse<{ resume: SavedResume }>(response);
  return payload.resume;
}

export async function deleteResume(id: string): Promise<void> {
  const response = await fetch(`/api/resumeow/resumes/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  await parseResponse<{ success: boolean }>(response);
}

export async function saveResume(
  resumeData: ResumeData,
  title: string,
  existingId?: string
): Promise<SavedResume> {
  if (existingId) {
    return updateResume(existingId, title, resumeData);
  }

  return createResume(title, resumeData);
}
