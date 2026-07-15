import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/supabase/require-user";
import { runResumeowChat, loadResumeAiState } from "@/lib/ai/resumeow/chat";
import { enforceRateLimit } from "@/lib/ai/resumeow/rate-limit";
import {
  getResumeById,
  getResumeProfile,
} from "@/lib/services/resume-server-service";
import { sseEvent } from "@/lib/ai/resumeow/utils";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { user, error } = await requireUser();
  if (!user) {
    return NextResponse.json({ error }, { status: 401 });
  }

  const resumeId = request.nextUrl.searchParams.get("resumeId");
  if (!resumeId) {
    return NextResponse.json(
      { error: "Missing resumeId query parameter" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const state = await loadResumeAiState(supabase, user.id, resumeId);

  return NextResponse.json(state);
}

export async function POST(request: NextRequest) {
  const { user, error } = await requireUser();
  if (!user) {
    return NextResponse.json({ error }, { status: 401 });
  }

  const body = await request.json();
  if (!body.resumeId || !Array.isArray(body.messages)) {
    return NextResponse.json(
      { error: "Missing resumeId or messages" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const chatLimit = await enforceRateLimit(supabase, user.id, "chat_requests");
  if (!chatLimit.allowed) {
    return NextResponse.json(
      {
        error: "Chat rate limit exceeded",
        rateLimit: chatLimit,
      },
      { status: 429 }
    );
  }

  const actionHint = body.actionHint ?? null;
  const resume = await getResumeById(supabase, user.id, body.resumeId);
  if (!resume) {
    return NextResponse.json({ error: "Resume not found" }, { status: 404 });
  }

  const profile = await getResumeProfile(supabase, user.id);

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const writer = new WritableStream<Uint8Array>({
        write(chunk) {
          controller.enqueue(chunk);
        },
      }).getWriter();

      try {
        await runResumeowChat({
          supabase,
          userId: user.id,
          resume,
          profile,
          inputMessages: body.messages,
          actionHint,
          jobDescriptionId: body.jobDescriptionId ?? null,
          writer,
        });
      } catch (chatError) {
        const encoder = new TextEncoder();
        const errorMessage =
          chatError instanceof Error ? chatError.message : "Chat failed";
        const rateLimit =
          typeof chatError === "object" &&
          chatError !== null &&
          "rateLimit" in chatError
            ? (chatError as { rateLimit?: unknown }).rateLimit ?? null
            : null;
        controller.enqueue(
          encoder.encode(
            sseEvent("error", {
              message: errorMessage,
              rateLimit,
            })
          )
        );
      } finally {
        await writer.close();
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
