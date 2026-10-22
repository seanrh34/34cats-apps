import { RETURN_PATH_COOKIE, safeReturnPath } from "@/lib/auth/return-path";
import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Send the user back to the page they were on when they chose to sign in
  const returnPath = safeReturnPath(request.cookies.get(RETURN_PATH_COOKIE)?.value);
  const response = NextResponse.redirect(`${origin}${returnPath}`);
  response.cookies.delete(RETURN_PATH_COOKIE);
  return response;
}
