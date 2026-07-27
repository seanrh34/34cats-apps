"use client";

import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (user && !loading) {
      router.push("/");
    }
  }, [user, loading, router]);

  const handleGoogleSignIn = async () => {
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error("Failed to sign in:", err);
      setError("That didn't work. Try again in a moment.");
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center">
        <p className="label text-ash-dim">Loading</p>
      </main>
    );
  }

  return (
    <main className="page-glow flex min-h-[80vh] items-center justify-center px-6 py-20">
      <div className="w-full max-w-md">
        <p className="label text-ash-dim">34cats — account</p>
        <h1 className="mt-5 font-display text-5xl leading-tight text-bone">
          One account,
          <br />
          <span className="italic text-ember">every app.</span>
        </h1>
        <p className="mt-5 leading-relaxed text-ash">
          Sign in so your work saves to the cloud and follows you between
          devices. No password to invent, no newsletter to escape from.
        </p>

        <button
          onClick={handleGoogleSignIn}
          className="mt-10 flex w-full cursor-pointer items-center justify-center gap-3 rounded-full border border-line-strong bg-ink-raised px-6 py-3.5 font-medium text-bone transition-colors hover:border-ash-dim hover:bg-ink"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </button>

        {error && (
          <p role="alert" className="mt-4 text-sm text-ember">
            {error}
          </p>
        )}

        <p className="mt-6 text-sm text-ash-dim">
          By signing in you agree to the{" "}
          <a
            href="/terms-of-service"
            className="underline underline-offset-4 hover:text-ash"
          >
            terms
          </a>{" "}
          and{" "}
          <a
            href="/privacy-policy"
            className="underline underline-offset-4 hover:text-ash"
          >
            privacy policy
          </a>
          .
        </p>
      </div>
    </main>
  );
}
