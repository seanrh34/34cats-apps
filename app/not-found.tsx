import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center px-5 py-20 md:px-8">
      <div className="mx-auto w-full max-w-2xl text-center">
        <p className="portal-label text-signal">404</p>
        <h1 className="portal-heading mt-4 text-4xl sm:text-5xl">
          This page isn’t available yet.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-copy-muted sm:text-lg">
          The page you requested either doesn’t exist, or it’s coming soon but isn’t available yet.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/#apps" className="portal-button portal-button-primary w-full sm:w-auto">
            Browse apps
          </Link>
          <Link href="/" className="portal-button portal-button-secondary w-full sm:w-auto">
            Back home
          </Link>
        </div>
      </div>
    </main>
  );
}
