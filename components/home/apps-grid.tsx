import { apps } from "@/config/apps";
import { AppCard } from "./app-card";

export function AppsGrid() {
  return (
    <section id="apps" className="px-4 py-16">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-white">
          My Apps
        </h2>
        <p className="text-center text-gray-400 mb-12 max-w-2xl mx-auto">
          Discover Various Productivity and Utility Apps Designed to Enhance
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {apps.map((app, index) => (
            <AppCard key={index} app={app} />
          ))}
        </div>
      </div>
    </section>
  );
}
