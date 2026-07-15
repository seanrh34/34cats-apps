import { NextResponse } from "next/server";
import { jsonRoute } from "@/lib/api-route";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/supabase/require-user";
import {
  listUserResumes,
  saveResumeForUser,
} from "@/lib/services/resume-server-service";

export const GET = jsonRoute(async () => {
  const { user, error } = await requireUser();
  if (!user) {
    return NextResponse.json({ error }, { status: 401 });
  }

  const supabase = createAdminClient();
  const resumes = await listUserResumes(supabase, user.id);

  return NextResponse.json({
    resumes,
  });
});

export const POST = jsonRoute(async (request: Request) => {
  const { user, error } = await requireUser();
  if (!user) {
    return NextResponse.json({ error }, { status: 401 });
  }

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
    body.resumeData
  );

  return NextResponse.json({
    resume,
  });
});
