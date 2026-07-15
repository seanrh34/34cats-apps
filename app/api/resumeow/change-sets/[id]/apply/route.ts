import { NextResponse } from "next/server";
import { jsonRoute } from "@/lib/api-route";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/supabase/require-user";
import {
  getChangeSetById,
  getResumeById,
  saveResumeForUser,
  updateChangeSetStatus,
} from "@/lib/services/resume-server-service";

export const POST = jsonRoute(async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { user, error } = await requireUser();
  if (!user) {
    return NextResponse.json({ error }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createAdminClient();
  const changeSet = await getChangeSetById(supabase, user.id, id);

  if (!changeSet) {
    return NextResponse.json({ error: "Change set not found" }, { status: 404 });
  }

  const currentResume = await getResumeById(supabase, user.id, changeSet.resume_id);
  if (!currentResume) {
    return NextResponse.json({ error: "Resume not found" }, { status: 404 });
  }

  if (currentResume.resume_revision !== changeSet.base_resume_revision) {
    const staleChangeSet = await updateChangeSetStatus(
      supabase,
      user.id,
      changeSet.id,
      "stale"
    );

    return NextResponse.json(
      {
        error: "Resume changed since this draft was created",
        changeSet: staleChangeSet,
      },
      { status: 409 }
    );
  }

  const updatedResume = await saveResumeForUser(
    supabase,
    user.id,
    currentResume.title,
    changeSet.proposed_resume_data,
    currentResume.id
  );

  const appliedChangeSet = await updateChangeSetStatus(
    supabase,
    user.id,
    changeSet.id,
    "applied"
  );

  return NextResponse.json({
    resume: updatedResume,
    changeSet: appliedChangeSet,
  });
});
