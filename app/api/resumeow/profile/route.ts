import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/supabase/require-user";
import {
  getResumeProfile,
  saveResumeProfile,
} from "@/lib/services/resume-server-service";
import { syncProfileToRag } from "@/lib/ai/resumeow/rag";

export async function GET() {
  const { user, error } = await requireUser();
  if (!user) {
    return NextResponse.json({ error }, { status: 401 });
  }

  const supabase = createAdminClient();
  const profile = await getResumeProfile(supabase, user.id);

  return NextResponse.json({
    profile,
  });
}

export async function PUT(request: Request) {
  const { user, error } = await requireUser();
  if (!user) {
    return NextResponse.json({ error }, { status: 401 });
  }

  const body = await request.json();
  const supabase = createAdminClient();
  const profile = await saveResumeProfile(supabase, user.id, {
    professional_headline: body.professional_headline ?? "",
    target_roles: body.target_roles ?? [],
    years_experience:
      typeof body.years_experience === "number" ? body.years_experience : null,
    location_preferences: body.location_preferences ?? [],
    core_skills: body.core_skills ?? [],
    education_summary: body.education_summary ?? "",
    domain_focus: body.domain_focus ?? [],
    achievement_notes: body.achievement_notes ?? "",
  });

  await syncProfileToRag(supabase, user.id, profile);

  return NextResponse.json({
    profile,
  });
}
