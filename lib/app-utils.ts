import type { App, AppTint } from "@/lib/types";

export const tintClass: Record<AppTint, string> = {
  butter: "bg-butter",
  sage: "bg-sage",
  lilac: "bg-lilac",
  sky: "bg-sky",
};

/** Host + path shown in the fake browser bar, derived from the app href. */
export function appHost(app: Pick<App, "href">): string {
  if (app.href.startsWith("http")) {
    const url = new URL(app.href);
    return `${url.host}${url.pathname === "/" ? "" : url.pathname}`;
  }
  return `apps.34cats.com${app.href}`;
}
