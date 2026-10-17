import { apps } from "@/config/apps";

function unique(items: string[]) {
  return Array.from(new Set(items));
}

export function TickerStrip() {
  const items = unique([...apps.map((app) => app.name), ...apps.flatMap((app) => app.stack)]);
  // Two repeats per half so a half is always wider than a large viewport.
  const half = [...items, ...items];

  const renderHalf = (dup: boolean) => (
    <ul className="flex shrink-0 items-center" aria-hidden={dup || undefined} {...(dup ? { "data-dup": "" } : {})}>
      {half.map((item, i) => (
        <li key={i} className="flex items-center whitespace-nowrap font-mono text-sm uppercase tracking-[0.08em]">
          <span className="px-5">{item}</span>
          <span className="text-tomato" aria-hidden="true">✦</span>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="overflow-hidden py-6 md:py-8" role="region" aria-label="Technology used across the apps">
      <div className="marquee -mx-[4%] w-[108%] -rotate-[1.5deg] bg-copy py-3.5 text-platform md:py-4">
        <div className="marquee-track">
          {renderHalf(false)}
          {renderHalf(true)}
        </div>
      </div>
    </div>
  );
}
