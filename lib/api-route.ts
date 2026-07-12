import { NextResponse } from "next/server";

// Wraps a JSON API route handler so a thrown error becomes a logged JSON
// {error} response instead of an opaque Next.js 500 page.
export function jsonRoute<Args extends unknown[]>(
  handler: (...args: Args) => Promise<Response>
) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error("Resumeow API route error", error);
      const status =
        typeof error === "object" &&
        error !== null &&
        "status" in error &&
        typeof (error as { status?: unknown }).status === "number"
          ? (error as { status: number }).status
          : 500;

      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Request failed" },
        { status }
      );
    }
  };
}
