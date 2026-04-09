import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/supabase/require-user";
import {
  getChangeSetById,
  getResumeById,
  saveResumeForUser,
  updateChangeSetStatus,
} from "@/lib/services/resume-server-service";
import { syncResumeToRag } from "@/lib/ai/resumeow/rag";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  if (changeSet.status !== "applied") {
    return NextResponse.json(
      { error: "Only applied change sets can be undone" },
      { status: 409 }
    );
  }

  if (!changeSet.previous_resume_data) {
    return NextResponse.json(
      { error: "Missing previous resume snapshot for undo" },
      { status: 409 }
    );
  }

  const currentResume = await getResumeById(supabase, user.id, changeSet.resume_id);
  if (!currentResume) {
    return NextResponse.json({ error: "Resume not found" }, { status: 404 });
  }

  if (currentResume.resume_revision !== changeSet.base_resume_revision + 1) {
    return NextResponse.json(
      {
        error:
          "Undo is no longer available because the resume changed after the AI edit was applied",
      },
      { status: 409 }
    );
  }

  const restoredResume = await saveResumeForUser(
    supabase,
    user.id,
    currentResume.title,
    changeSet.previous_resume_data,
    currentResume.id
  );

  const revertedChangeSet = await updateChangeSetStatus(
    supabase,
    user.id,
    changeSet.id,
    "reverted"
  );
  await syncResumeToRag(supabase, restoredResume);

  return NextResponse.json({
    resume: restoredResume,
    changeSet: revertedChangeSet,
  });
}
