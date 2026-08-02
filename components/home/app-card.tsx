import Link from "next/link";
import Image from "next/image";
import { App } from "@/lib/types";

interface AppCardProps { app: App; }

export function AppCard({ app }: AppCardProps) {
  const isLive = app.status === "Live";
  const isExternal = app.href.startsWith("http");
  const actionClass = "portal-button portal-button-primary mt-6 w-full sm:w-auto";
  const action = isExternal ? (
    <a href={app.href} target="_blank" rel="noopener noreferrer" className={actionClass} aria-label={`Open ${app.name} in a new tab`}>Try app ↗</a>
  ) : (
    <Link href={app.href} className={actionClass}>Try app</Link>
  );

  return (
    <article className="group portal-panel flex h-full flex-col overflow-hidden">
      <div className="relative aspect-[16/10] w-full overflow-hidden border-b border-rail bg-surface-subtle">
        <Image
          src={app.image}
          alt={`Screenshot of ${app.name}`}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="scale-[1.25] object-cover transition-transform duration-300 ease-out group-hover:scale-[1.28]"
        />
      </div>
      <div className="flex flex-1 flex-col p-6 md:p-8">
        <div className="flex items-center justify-between gap-4">
          <span className={`status-pill rounded-full px-2.5 py-1 text-xs font-semibold ${isLive ? "bg-live/10 text-live" : "bg-warning/10 text-warning"}`}>{app.status}</span>
          <ul className="flex flex-wrap justify-end gap-2" aria-label={`${app.name} technology`}>
            {app.stack.map((technology) => <li key={technology} className="text-xs text-copy-muted">{technology}</li>)}
          </ul>
        </div>
        <h3 className="portal-heading mt-6 text-2xl text-copy">{app.name}</h3>
        <p className="mt-3 flex-1 leading-relaxed text-copy-muted">{app.description}</p>
        {isLive ? action : <span className="mt-6 text-sm font-medium text-copy-muted">Not yet available</span>}
      </div>
    </article>
  );
}
