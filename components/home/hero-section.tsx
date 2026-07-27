import Image from "next/image";
import { apps } from "@/config/apps";

export function HeroSection() {
  const liveCount = apps.filter((app) => app.status === "Live").length;

  const stats = [
    { k: "Live now", v: `${liveCount} apps` },
    { k: "Built by", v: "One person" },
    { k: "Funded by", v: "Nobody" },
    { k: "Your data", v: "Exportable" },
  ];

  return (
    <section id="home" className="page-glow relative">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 pt-16 pb-16 md:grid-cols-[1.35fr_1fr] md:pt-24 md:pb-24">
        <div>
          <p className="label text-ash-dim">34cats — index of apps</p>

          <h1 className="mt-6 font-display text-[clamp(2.75rem,7.5vw,5rem)] leading-[0.95] tracking-tight text-bone">
            Small software,
            <br />
            <span className="italic text-ember">made properly.</span>
          </h1>

          <p className="mt-8 max-w-lg text-lg leading-relaxed text-ash">
            Everything I build lives here. Independent apps, each one solving a
            problem I actually had, each one small enough to understand in an
            afternoon.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <a
              href="#apps"
              className="rounded-full bg-ember-deep px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-ember"
            >
              Browse the apps
            </a>
            <a
              href="#about"
              className="rounded-full border border-line-strong px-6 py-3 text-sm font-semibold text-bone transition-colors hover:border-ash-dim hover:bg-ink-raised"
            >
              Who builds this
            </a>
          </div>
        </div>

        <div className="hidden md:block">
          <Image
            src="/34cats_main.png"
            alt="34cats"
            width={2000}
            height={1000}
            priority
            className="h-auto w-full"
          />
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6">
        <dl className="grid grid-cols-2 gap-px border-y border-line bg-line sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.k} className="bg-ink px-4 py-6">
              <dt className="label text-ash-dim">{stat.k}</dt>
              <dd className="mt-2 font-display text-2xl text-bone">{stat.v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
