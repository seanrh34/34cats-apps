import { apps } from "@/config/apps";
import { AppCard } from "./app-card";

export function AppsGrid() {
  return (
    <section id="apps" className="px-5 pb-20 md:px-8 md:pb-28">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="portal-heading mt-2 text-4xl text-copy md:text-5xl">Try Out My Apps</h2>
          </div>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {apps.map((app) => <AppCard key={app.name} app={app} />)}
        </div>
        <p className="mt-6 text-sm text-copy-muted">New apps join the collection as I learn new technologies.</p>
      </div>
    </section>
  );
}
