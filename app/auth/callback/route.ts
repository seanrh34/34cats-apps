import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getSafeRedirectPath } from "@/lib/auth/redirect";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;
  const nextPath = getSafeRedirectPath(requestUrl.searchParams.get("next"), "/");

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL(nextPath, origin));
}
