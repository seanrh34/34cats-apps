import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/supabase/require-user";
import {
  deleteJobDescription,
  deleteRagDocumentBySourceKey,
  listJobDescriptions,
  saveJobDescription,
} from "@/lib/services/resume-server-service";
import { syncJobDescriptionToRag } from "@/lib/ai/resumeow/rag";

export async function GET() {
  const { user, error } = await requireUser();
  if (!user) {
    return NextResponse.json({ error }, { status: 401 });
  }

  const supabase = createAdminClient();
  const jobDescriptions = await listJobDescriptions(supabase, user.id);

  return NextResponse.json({
    jobDescriptions,
  });
}

export async function POST(request: Request) {
  const { user, error } = await requireUser();
  if (!user) {
    return NextResponse.json({ error }, { status: 401 });
  }

  const body = await request.json();
  if (!body.content || typeof body.content !== "string") {
    return NextResponse.json(
      { error: "Missing job description content" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const jobDescription = await saveJobDescription(supabase, user.id, {
    id: body.id,
    title:
      typeof body.title === "string" && body.title.trim()
        ? body.title.trim()
        : "Untitled job description",
    company: typeof body.company === "string" ? body.company.trim() : "",
    role: typeof body.role === "string" ? body.role.trim() : "",
    content: body.content,
  });

  await syncJobDescriptionToRag(supabase, jobDescription);

  return NextResponse.json({
    jobDescription,
  });
}

export async function DELETE(request: Request) {
  const { user, error } = await requireUser();
  if (!user) {
    return NextResponse.json({ error }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const id =
    body && typeof body.id === "string" && body.id.trim()
      ? body.id.trim()
      : null;

  if (!id) {
    return NextResponse.json(
      { error: "Missing job description id" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  await deleteJobDescription(supabase, user.id, id);
  await deleteRagDocumentBySourceKey(supabase, `job-description:${id}`, user.id);

  return NextResponse.json({
    success: true,
    id,
  });
}
