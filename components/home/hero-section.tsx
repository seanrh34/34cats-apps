import { apps } from "@/config/apps";
import { appHost } from "@/lib/app-utils";
import { HeroDesk } from "./hero-desk";

const words = ["My", "proving", "grounds,", "your"];

export function HeroSection() {
  const liveCount = apps.filter((app) => app.status === "Live").length;
  const tiles = apps.map((app) => ({ name: app.name, host: appHost(app), status: app.status, tint: app.tint ?? "sky" }));

  return (
    <section id="home" className="relative px-5 pb-4 pt-10 md:px-8 md:pb-20 md:pt-16">
      <div className="hero-dots pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-6">
        <div>
          <p className="hero-fade portal-label flex items-center gap-2.5 text-copy" style={{ "--d": "0ms" } as React.CSSProperties}>
            <span className="pulse-dot size-2.5 rounded-full bg-tomato" aria-hidden="true" />
            Software projects by Sean
          </p>
          <h1 className="portal-heading mt-5 text-[clamp(3rem,8vw,6.5rem)] leading-[0.95] tracking-[-0.04em] text-copy">
            {words.map((word, i) => (
              <span key={word}>
                <span className="word-mask">
                  <span className="word" style={{ "--i": i } as React.CSSProperties}>{word}</span>
                </span>{" "}
              </span>
            ))}
            <span className="inline-block whitespace-nowrap">
              <span className="relative inline-block">
                <span className="word-mask">
                  <span className="word text-tomato" style={{ "--i": words.length } as React.CSSProperties}>playground</span>
                </span>
                <svg className="squiggle pointer-events-none absolute -bottom-[0.1em] left-0 h-[0.2em] w-full" viewBox="0 0 300 14" preserveAspectRatio="none" fill="none" aria-hidden="true">
                  <path d="M3 8 C22 1 36 14 56 7 S92 2 112 9 S152 14 172 6 S216 2 236 9 S276 13 297 5" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round" pathLength={1} />
                </svg>
              </span>
              <span className="word-mask">
                <span className="word" style={{ "--i": words.length + 1 } as React.CSSProperties}>.</span>
              </span>
            </span>
          </h1>
          <p className="hero-fade mt-7 max-w-xl text-lg leading-relaxed text-copy-muted md:text-xl" style={{ "--d": "800ms" } as React.CSSProperties}>
            Practical web tools I build to learn new technologies — and keep running after launch. Most are free; one 34cats
            credit balance covers the paid bits.
          </p>
          <div className="hero-fade mt-8 flex flex-col gap-3.5 sm:flex-row" style={{ "--d": "950ms" } as React.CSSProperties}>
            <a href="#apps" className="portal-button portal-button-primary">
              Explore the apps <span className="btn-arrow-down" aria-hidden="true">↓</span>
            </a>
            <a href="https://credits.34cats.com" target="_blank" rel="noopener noreferrer" className="portal-button portal-button-secondary">
              How credits work <span className="btn-arrow-up" aria-hidden="true">↗</span>
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </div>
          <p className="hero-fade portal-label mt-7 flex flex-wrap gap-x-2 gap-y-1 text-copy-muted" style={{ "--d": "1100ms" } as React.CSSProperties}>
            <span className="whitespace-nowrap">{liveCount} {liveCount === 1 ? "app" : "apps"} live ·</span>
            <span className="whitespace-nowrap">free to try ·</span>
            <span className="whitespace-nowrap">no card needed</span>
          </p>
        </div>

        <div className="mt-2 lg:mt-0">
          <HeroDesk tiles={tiles} />
        </div>
      </div>
    </section>
  );
}
