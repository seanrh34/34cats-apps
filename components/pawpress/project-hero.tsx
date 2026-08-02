import Image from "next/image";

export function ProjectHero() {
  return (
    <section className="grid items-center gap-10 border-b border-rail pb-14 md:pb-20 lg:grid-cols-[0.82fr_1.18fr] lg:gap-14">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="status-pill rounded-full bg-live/10 px-2.5 py-1 text-xs font-semibold text-live">
            Open source
          </span>
          <span className="portal-label text-copy-muted">MIT licensed</span>
        </div>

        <h1 className="portal-heading mt-5 text-[clamp(2.75rem,6vw,5rem)] leading-[0.98] tracking-[-0.035em] text-copy">
          Fork a complete blog CMS. Make it yours.
        </h1>
        <p className="mt-6 max-w-[58ch] text-lg leading-relaxed text-copy md:text-xl">
          PawPress is a full-featured Next.js 15 blog framework with a Lexical
          editor, admin dashboard, and Supabase-backed content—built for
          developers who would rather own the code than rent another CMS.
        </p>
        <p className="mt-4 max-w-[60ch] leading-relaxed text-copy-muted">
          See it running on the 34cats blog, then clone or fork the repository
          if the approach fits your project.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a
            href="https://blog.34cats.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="portal-button portal-button-primary"
          >
            Visit the live blog
            <span aria-hidden="true">↗</span>
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
          <a
            href="https://github.com/seanrh34/PawPress"
            target="_blank"
            rel="noopener noreferrer"
            className="portal-button portal-button-secondary"
          >
            View source on GitHub
            <span aria-hidden="true">↗</span>
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </div>

        <p className="mt-5 text-sm leading-relaxed text-copy-muted">
          Requires Node.js 18+, Supabase, and a Next.js hosting provider.
        </p>
      </div>

      <figure className="portal-panel overflow-hidden p-2">
        <Image
          src="/images/pawpress-screenshot.png"
          alt="PawPress admin editor showing a blog post being written"
          width={1600}
          height={1000}
          sizes="(min-width: 1024px) 52vw, 100vw"
          className="h-auto w-full rounded-[0.7rem]"
          priority
        />
        <figcaption className="px-3 py-3 text-sm leading-relaxed text-copy-muted">
          The PawPress editor used to publish the live 34cats blog.
        </figcaption>
      </figure>
    </section>
  );
}
