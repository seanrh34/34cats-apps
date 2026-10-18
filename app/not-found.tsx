import Link from "next/link";
import { Cat } from "@/components/brand/cat";

export default function NotFound() {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center px-5 py-16 md:px-8">
      <div className="mx-auto w-full max-w-2xl text-center">
        <div className="relative mx-auto w-36 sm:w-44" aria-hidden="true">
          <Cat track={false} still look={{ x: 0.8, y: -0.9 }} className="relative z-10 block w-full" />
          <span className="zzz absolute -right-3 top-2 font-mono text-3xl font-medium text-signal" style={{ "--k": 0 } as React.CSSProperties}>?</span>
          <span className="zzz absolute -right-9 top-8 font-mono text-xl font-medium text-signal" style={{ "--k": 1 } as React.CSSProperties}>?</span>
        </div>
        <p className="portal-heading -mt-3 text-[clamp(7rem,30vw,13rem)] leading-[0.85] tracking-[-0.06em] text-tomato">404</p>
        <h1 className="portal-heading mt-6 text-4xl sm:text-5xl">
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
