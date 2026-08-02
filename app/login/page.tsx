"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

export default function LoginPage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && !loading) router.push("/");
  }, [user, loading, router]);

  const handleGoogleSignIn = async () => {
    setError(null);
    try {
      await signInWithGoogle();
    } catch (signInError) {
      console.error("Failed to sign in:", signInError);
      setError("Sign-in did not complete. Check your connection and try again.");
    }
  };

  if (loading) {
    return <main className="flex min-h-[70vh] items-center justify-center px-5" aria-live="polite"><p className="text-sm text-copy-muted">Checking your account…</p></main>;
  }

  return (
    <main className="flex min-h-[80vh] items-center px-5 py-16 md:px-8">
      <section className="portal-panel mx-auto w-full max-w-md p-6 md:p-8" aria-labelledby="sign-in-title">
        <p className="portal-label text-signal">34cats account</p>
        <h1 id="sign-in-title" className="portal-heading mt-3 text-3xl text-copy">Sign in across the network</h1>
        <p className="mt-3 leading-relaxed text-copy-muted">Use one account for supported 34cats apps. No separate password is required.</p>
        <button type="button" onClick={handleGoogleSignIn} className="portal-button portal-button-primary mt-8 w-full cursor-pointer">
          <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>
        {error && <p role="alert" className="mt-4 text-sm leading-relaxed text-cancelled">{error}</p>}
        <p className="mt-5 text-sm leading-relaxed text-copy-muted">By continuing, you agree to the <a href="/terms-of-service" className="underline underline-offset-4 hover:text-copy">terms</a> and <a href="/privacy-policy" className="underline underline-offset-4 hover:text-copy">privacy policy</a>.</p>
      </section>
    </main>
  );
}
