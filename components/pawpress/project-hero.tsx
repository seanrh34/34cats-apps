interface ProjectHeroProps {
  title: string;
  tagline: string;
  subtitle?: string;
}

export function ProjectHero({ title, tagline, subtitle }: ProjectHeroProps) {
  return (
    <section className="text-center mb-20">
      <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
        {title}
      </h1>
      <p className="text-2xl text-gray-300 mb-4 max-w-3xl mx-auto">
        {tagline}
      </p>
      {subtitle && (
        <p className="text-lg text-gray-400 max-w-2xl mx-auto">
          {subtitle}
        </p>
      )}
    </section>
  );
}
