export const RETURN_PATH_COOKIE = "auth_return_path";

/**
 * Only allow same-origin relative paths so the post-login redirect
 * can't be abused as an open redirect.
 */
export function safeReturnPath(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return "/";
  if (value === "/login" || value.startsWith("/login?") || value.startsWith("/auth/")) return "/";
  return value;
}
