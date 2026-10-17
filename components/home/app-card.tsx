import Link from "next/link";
import Image from "next/image";
import type { CSSProperties } from "react";
import { Bracket } from "@/components/brand/bracket";
import { appHost, tintClass } from "@/lib/app-utils";
import { App } from "@/lib/types";

interface AppCardProps {
  app: App;
  /** Alternates the screenshot frame tilt between cards. */
  index?: number;
}

export function AppCard({ app, index = 0 }: AppCardProps) {
  const isLive = app.status === "Live";
  const isExternal = app.href.startsWith("http");
  const linkProps = isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {};
  const actionClass = "portal-button portal-button-primary mt-7 w-full sm:w-auto";
  const action = isExternal ? (
    <a href={app.href} {...linkProps} className={actionClass} aria-label={`Open ${app.name} in a new tab`}>
      Open app <span className="btn-arrow-up" aria-hidden="true">↗</span>
    </a>
  ) : (
    <Link href={app.href} className={actionClass}>
      Open app <span className="btn-arrow" aria-hidden="true">→</span>
    </Link>
  );

  const frame = (
    <div className="card-frame overflow-hidden rounded-xl border-2 border-copy bg-platform-raised" style={{ "--frame-rot": index % 2 ? "1.5deg" : "-1.5deg" } as CSSProperties}>
      <div className="flex items-center gap-3 border-b-2 border-copy bg-surface-subtle px-3 py-2" aria-hidden="true">
        <span className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-tomato" />
          <span className="size-2.5 rounded-full bg-butter" />
          <span className="size-2.5 rounded-full bg-sage" />
        </span>
        <span className="min-w-0 flex-1 truncate rounded-full bg-platform-raised px-3 py-1 font-mono text-[0.6875rem] text-copy-muted">{appHost(app)}</span>
      </div>
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-subtle">
        <Image
          src={app.image}
          alt={`Screenshot of ${app.name}`}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="scale-[1.25] object-cover"
        />
      </div>
    </div>
  );

  return (
    <article className="app-card group relative h-full">
      <div className="relative flex h-full flex-col overflow-hidden rounded-panel border border-rail bg-platform-raised">
        <div className={`${tintClass[app.tint ?? "sky"]} relative overflow-hidden px-6 pb-9 pt-10 md:px-9`}>
          <Bracket shape="corner" className="card-corner absolute left-4 top-4 size-8" stroke="var(--text)" strokeWidth={3.5} />
          {isLive ? (
            <a href={app.href} {...linkProps} tabIndex={-1} aria-hidden="true" className="block">
              {frame}
            </a>
          ) : (
            frame
          )}
        </div>
        <div className="flex flex-1 flex-col p-6 md:p-8">
          <span
            className={`status-pill portal-label w-fit items-center gap-2 rounded-full px-3 py-1.5 ${isLive ? "bg-live/12 text-live" : "bg-warning/12 text-warning"}`}
          >
            <span className={`size-2 rounded-full ${isLive ? "live-dot bg-live" : "bg-warning"}`} aria-hidden="true" />
            {app.status}
          </span>
          <h3 className="portal-heading mt-5 text-3xl text-copy md:text-4xl">{app.name}</h3>
          <p className="mt-3 flex-1 leading-relaxed text-copy-muted">{app.description}</p>
          <ul className="mt-5 flex flex-wrap gap-2" aria-label={`${app.name} technology`}>
            {app.stack.map((technology) => (
              <li key={technology} className="rounded-full border border-rail-strong px-2.5 py-1 font-mono text-xs text-copy-muted">
                {technology}
              </li>
            ))}
          </ul>
          {isLive ? action : <span className="mt-7 text-sm font-medium text-copy-muted">Not yet available</span>}
        </div>
      </div>
    </article>
  );
}
