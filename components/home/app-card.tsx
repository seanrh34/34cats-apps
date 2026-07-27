import { App } from "@/lib/types";
import Link from "next/link";

interface AppCardProps {
  app: App;
  index: number;
}

/** One row of the apps index. External apps live on their own subdomain. */
export function AppCard({ app, index }: AppCardProps) {
  const isLive = app.status === "Live";
  const isExternal = app.href.startsWith("http");

  const body = (
    <>
      <div className="flex items-baseline gap-4 md:w-64 md:shrink-0">
        <span className="label tabular-nums text-ash-dim">
          {String(index + 1).padStart(2, "0")}
        </span>
        <h3 className="font-display text-3xl text-bone transition-colors group-hover:text-ember">
          {app.name}
        </h3>
      </div>

      <div className="flex-1">
        <p className="max-w-xl leading-relaxed text-ash">{app.description}</p>
        <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1">
          {app.stack.map((tech) => (
            <li key={tech} className="label text-ash-dim">
              {tech}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-center gap-4 md:w-40 md:shrink-0 md:justify-end">
        <span
          className={`label ${isLive ? "text-moss" : "text-ash-dim"}`}
        >
          {isLive ? "● Live" : `○ ${app.status}`}
        </span>
        {isLive && (
          <span
            aria-hidden
            className="text-ash transition-transform group-hover:translate-x-1 group-hover:text-ember"
          >
            {isExternal ? "↗" : "→"}
          </span>
        )}
      </div>
    </>
  );

  const className =
    "group flex flex-col gap-4 border-b border-line px-1 py-8 transition-colors md:flex-row md:items-start md:gap-8";

  if (!isLive) {
    return <div className={`${className} opacity-50`}>{body}</div>;
  }

  if (isExternal) {
    return (
      <a
        href={app.href}
        target="_blank"
        rel="noopener noreferrer"
        className={`${className} hover:bg-ink-raised`}
      >
        {body}
      </a>
    );
  }

  return (
    <Link href={app.href} className={`${className} hover:bg-ink-raised`}>
      {body}
    </Link>
  );
}
