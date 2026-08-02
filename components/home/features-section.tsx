import { features } from "@/config/apps";

export function FeaturesSection() {
  return (
    <section className="border-y border-rail bg-platform-raised px-5 py-20 md:px-8 md:py-28">
      <div className="mx-auto max-w-6xl">
        <p className="portal-label text-signal">What each app does</p>
        <h2 className="portal-heading mt-2 max-w-2xl text-4xl text-copy md:text-5xl">Built to be used, not compared.</h2>
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.title}>
              <h3 className="portal-heading text-xl text-copy">{feature.title}</h3>
              <p className="mt-3 leading-relaxed text-copy-muted">{feature.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
