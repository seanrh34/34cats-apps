export function getSafeRedirectPath(
  path: string | null | undefined,
  fallback = "/"
): string {
  if (!path) {
    return fallback;
  }

  if (!path.startsWith("/") || path.startsWith("//")) {
    return fallback;
  }

  return path;
}
