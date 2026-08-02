interface ProjectHeroProps {
  title: string;
  tagline: string;
  subtitle?: string;
}

export function ProjectHero({ title, tagline, subtitle }: ProjectHeroProps) {
  return (
    <section className="mb-16 border-b border-rail pb-12">
      <span className="status-pill inline-flex rounded-full bg-live/10 px-2.5 py-1 text-xs font-semibold text-live">Live</span>
      <h1 className="portal-heading mt-5 text-[clamp(2.75rem,7vw,5.5rem)] leading-none tracking-[-0.035em] text-copy">{title}</h1>
      <p className="mt-6 max-w-[65ch] text-xl leading-relaxed text-copy">{tagline}</p>
      {subtitle && <p className="mt-3 max-w-[70ch] leading-relaxed text-copy-muted">{subtitle}</p>}
    </section>
  );
}
