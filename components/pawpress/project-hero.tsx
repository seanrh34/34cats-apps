interface ProjectHeroProps {
  title: string;
  tagline: string;
  subtitle?: string;
}

export function ProjectHero({ title, tagline, subtitle }: ProjectHeroProps) {
  return (
    <section className="mb-20 border-b border-line pb-16">
      <p className="label text-ash-dim">Project</p>
      <h1 className="mt-5 font-display text-[clamp(2.5rem,6vw,4.25rem)] leading-[1] text-bone">
        {title}
      </h1>
      <p className="mt-8 max-w-2xl text-xl leading-relaxed text-bone">
        {tagline}
      </p>
      {subtitle && (
        <p className="mt-4 max-w-2xl leading-relaxed text-ash">{subtitle}</p>
      )}
    </section>
  );
}
