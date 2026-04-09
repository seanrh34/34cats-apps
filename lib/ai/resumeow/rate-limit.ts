import { RATE_LIMIT_CONFIG } from "@/lib/ai/resumeow/constants";
import { ResumeAiRateLimitStatus } from "@/lib/types/resume";
import { SupabaseClient } from "@supabase/supabase-js";

type RateLimitAction = keyof typeof RATE_LIMIT_CONFIG;

export async function enforceRateLimit(
  supabase: SupabaseClient,
  userId: string,
  action: RateLimitAction
): Promise<ResumeAiRateLimitStatus> {
  const config = RATE_LIMIT_CONFIG[action];

  const { data, error } = await supabase.rpc(
    "check_and_increment_resume_ai_rate_limit",
    {
      p_user_id: userId,
      p_action: action,
      p_limit: config.limit,
      p_window_seconds: config.windowSeconds,
    }
  );

  if (error) {
    console.error("Failed to enforce rate limit", error);
    throw new Error(error.message ?? "Failed to enforce rate limit");
  }

  const payload = Array.isArray(data) ? data[0] : data;

  return {
    action,
    allowed: Boolean(payload?.allowed),
    current_count: Number(payload?.current_count ?? 0),
    limit_value: Number(payload?.limit_value ?? config.limit),
    retry_after_seconds: Number(payload?.retry_after_seconds ?? 0),
    window_started_at: payload?.window_started_at ?? new Date().toISOString(),
  };
}
