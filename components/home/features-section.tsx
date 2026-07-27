import { features } from "@/config/apps";

export function FeaturesSection() {
  return (
    <section className="border-y border-line bg-ink-raised px-6 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <p className="label text-ash-dim">How these get built</p>
        <h2 className="mt-4 max-w-2xl font-display text-4xl leading-tight text-bone md:text-5xl">
          Three rules I don&apos;t break.
        </h2>

        <div className="mt-14 grid gap-px bg-line md:grid-cols-3">
          {features.map((feature, index) => (
            <div key={feature.title} className="bg-ink-raised p-8 md:p-10">
              <span className="label tabular-nums text-ash-dim">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-6 font-display text-2xl text-bone">
                {feature.title}
              </h3>
              <p className="mt-3 leading-relaxed text-ash">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
