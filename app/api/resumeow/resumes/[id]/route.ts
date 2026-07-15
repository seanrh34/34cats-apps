import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/supabase/require-user";
import {
  deleteResumeForUser,
  getResumeById,
  saveResumeForUser,
} from "@/lib/services/resume-server-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireUser();
  if (!user) {
    return NextResponse.json({ error }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createAdminClient();
  const resume = await getResumeById(supabase, user.id, id);

  return NextResponse.json({
    resume,
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireUser();
  if (!user) {
    return NextResponse.json({ error }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const title =
    typeof body.title === "string" && body.title.trim()
      ? body.title.trim()
      : "My Resume";

  if (!body.resumeData) {
    return NextResponse.json(
      { error: "Missing resumeData" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const resume = await saveResumeForUser(
    supabase,
    user.id,
    title,
    body.resumeData,
    id
  );

  return NextResponse.json({
    resume,
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireUser();
  if (!user) {
    return NextResponse.json({ error }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createAdminClient();
  await deleteResumeForUser(supabase, user.id, id);

  return NextResponse.json({
    success: true,
  });
}
