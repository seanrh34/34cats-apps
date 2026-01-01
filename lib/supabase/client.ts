import { createBrowserClient } from "@supabase/ssr";

/**
 * Create a Supabase client for use in Client Components
 * This client is safe to use in the browser
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
