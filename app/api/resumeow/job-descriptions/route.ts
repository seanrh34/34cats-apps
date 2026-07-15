import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/supabase/require-user";
import {
  countJobDescriptionsForUser,
  deleteJobDescription,
  getJobDescriptionById,
  listJobDescriptions,
  saveJobDescription,
} from "@/lib/services/resume-server-service";

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
  const requestedId =
    typeof body.id === "string" && body.id.trim() ? body.id.trim() : null;

  let saveId: string | undefined;
  if (requestedId) {
    const existing = await getJobDescriptionById(supabase, user.id, requestedId);
    if (!existing) {
      return NextResponse.json(
        { error: "Job description not found for update" },
        { status: 404 }
      );
    }
    saveId = requestedId;
  } else {
    const currentCount = await countJobDescriptionsForUser(supabase, user.id);
    if (currentCount >= 3) {
      return NextResponse.json(
        { error: "You can save up to 3 job descriptions." },
        { status: 409 }
      );
    }
  }

  const jobDescription = await saveJobDescription(supabase, user.id, {
    id: saveId,
    title:
      typeof body.title === "string" && body.title.trim()
        ? body.title.trim()
        : "Untitled job description",
    company: typeof body.company === "string" ? body.company.trim() : "",
    role: typeof body.role === "string" ? body.role.trim() : "",
    content: body.content,
  });

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

  return NextResponse.json({
    success: true,
    id,
  });
}
