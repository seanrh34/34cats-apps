import { apps } from "@/config/apps";
import { AppCard } from "./app-card";

export function AppsGrid() {
  return (
    <section id="apps" className="px-6 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 border-b border-line-strong pb-6 md:flex-row md:items-end md:justify-between">
          <h2 className="font-display text-4xl text-bone md:text-5xl">
            The apps
          </h2>
          <p className="max-w-sm text-sm leading-relaxed text-ash">
            Free to use unless it costs me money to run. Nothing here is a
            trial, a beta list, or a funnel to a sales call.
          </p>
        </div>

        <div>
          {apps.map((app, index) => (
            <AppCard key={app.name} app={app} index={index} />
          ))}
        </div>

        <p className="pt-8 text-sm text-ash-dim">
          More on the workbench. New ones land here first.
        </p>
      </div>
    </section>
  );
}
