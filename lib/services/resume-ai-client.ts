import {
  ResumeAiMessage,
  ResumeChangeSet,
  ResumeJobDescription,
  ResumeProfile,
  SavedResume,
} from "@/lib/types/resume";

type ErrorWithRateLimit = Error & {
  rateLimit?: unknown;
};

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(payload?.error ?? "Request failed") as ErrorWithRateLimit;
    error.rateLimit = payload?.rateLimit ?? null;
    throw error;
  }

  return payload;
}

export async function fetchResumeProfile() {
  const response = await fetch("/api/resumeow/profile", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  return parseJsonResponse<{ profile: ResumeProfile | null }>(response);
}

export async function saveResumeProfileRequest(
  profile: Omit<ResumeProfile, "id" | "user_id" | "created_at" | "updated_at">
) {
  const response = await fetch("/api/resumeow/profile", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(profile),
  });

  return parseJsonResponse<{ profile: ResumeProfile }>(response);
}

export async function fetchResumeAiState(resumeId: string) {
  const response = await fetch(`/api/resumeow/chat?resumeId=${resumeId}`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  return parseJsonResponse<{
    messages: ResumeAiMessage[];
    changeSets: ResumeChangeSet[];
    jobDescriptions: ResumeJobDescription[];
  }>(response);
}

export async function saveJobDescriptionRequest(payload: {
  id?: string;
  title: string;
  company: string;
  role: string;
  content: string;
}) {
  const response = await fetch("/api/resumeow/job-descriptions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  return parseJsonResponse<{ jobDescription: ResumeJobDescription }>(response);
}

export async function deleteJobDescriptionRequest(id: string) {
  const response = await fetch("/api/resumeow/job-descriptions", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ id }),
  });

  return parseJsonResponse<{ success: boolean; id: string }>(response);
}

export async function applyChangeSetRequest(changeSetId: string) {
  const response = await fetch(`/api/resumeow/change-sets/${changeSetId}/apply`, {
    method: "POST",
    credentials: "include",
  });

  return parseJsonResponse<{
    resume: SavedResume;
    changeSet: ResumeChangeSet;
  }>(response);
}

export async function undoChangeSetRequest(changeSetId: string) {
  const response = await fetch(`/api/resumeow/change-sets/${changeSetId}/undo`, {
    method: "POST",
    credentials: "include",
  });

  return parseJsonResponse<{
    resume: SavedResume;
    changeSet: ResumeChangeSet;
  }>(response);
}

export async function streamResumeChat(
  payload: {
    resumeId: string;
    messages: Array<{ role: string; content: string }>;
    actionHint?: "review" | "edit" | null;
    jobDescriptionId?: string | null;
  },
  handlers: {
    onToken: (token: string) => void;
    onToolStart?: (payload: Record<string, unknown>) => void;
    onToolResult?: (payload: Record<string, unknown>) => void;
    onAssistantDone?: (payload: { message: ResumeAiMessage }) => void;
    onError?: (payload: { message: string; rateLimit?: unknown }) => void;
  }
) {
  const response = await fetch("/api/resumeow/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!response.ok || !response.body) {
    const errorPayload = await response.json().catch(() => null);
    const error = new Error(
      errorPayload?.error ?? "Failed to start chat"
    ) as ErrorWithRateLimit;
    error.rateLimit = errorPayload?.rateLimit ?? null;
    throw error;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";

    for (const event of events) {
      const lines = event.split("\n");
      const eventName = lines.find((line) => line.startsWith("event:"));
      const dataLine = lines.find((line) => line.startsWith("data:"));

      if (!eventName || !dataLine) {
        continue;
      }

      const name = eventName.replace(/^event:\s*/, "").trim();
      const data = JSON.parse(dataLine.replace(/^data:\s*/, ""));

      if (name === "token") {
        handlers.onToken(data.text ?? "");
      }

      if (name === "tool_start") {
        handlers.onToolStart?.(data);
      }

      if (name === "tool_result") {
        handlers.onToolResult?.(data);
      }

      if (name === "assistant_done") {
        handlers.onAssistantDone?.(data);
      }

      if (name === "error") {
        handlers.onError?.(data);
      }
    }
  }
}
