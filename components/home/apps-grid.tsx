import { apps } from "@/config/apps";
import { Reveal } from "@/components/motion/reveal";
import { AppCard } from "./app-card";

export function AppsGrid() {
  return (
    <section id="apps" className="px-5 pb-20 pt-10 md:px-8 md:pb-28 md:pt-14">
      <div className="mx-auto max-w-6xl">
        <Reveal className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="portal-label text-signal">The shelf — {String(apps.length).padStart(2, "0")} {apps.length === 1 ? "app" : "apps"}</p>
            <h2 className="portal-heading mt-3 text-4xl text-copy md:text-6xl">Things I&apos;ve shipped.</h2>
          </div>
          <p className="max-w-xs text-copy-muted md:text-right">New apps join as I learn new tech.</p>
        </Reveal>
        <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-10">
          {apps.map((app, i) => (
            <Reveal key={app.name} variant="tilt" delay={i * 140} tilt={i % 2 ? "2deg" : "-2deg"} className="h-full">
              <AppCard app={app} index={i} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
