import { BrowserFrame } from "@/components/shared/browser-frame";
import { Reveal } from "@/components/motion/reveal";

export function ProjectHero() {
  return (
    <section className="grid items-center gap-10 border-b border-rail pb-14 md:pb-20 lg:grid-cols-[0.82fr_1.18fr] lg:gap-14">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="status-pill portal-label rounded-full bg-live/12 px-3 py-1.5 text-live">
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

      <Reveal as="figure" variant="tilt" tilt="1.5deg" delay={150} className="frame-hover">
        <div className="relative overflow-hidden rounded-panel border border-rail bg-butter px-5 pb-8 pt-9 md:px-9">
          <BrowserFrame
            src="/images/pawpress-screenshot.png"
            alt="PawPress admin editor showing a blog post being written"
            host="blog.34cats.com"
            rotate={1.2}
            sizes="(min-width: 1024px) 52vw, 100vw"
            priority
          />
        </div>
        <figcaption className="px-1 py-3 text-sm leading-relaxed text-copy-muted">
          The PawPress editor used to publish the live 34cats blog.
        </figcaption>
      </Reveal>
    </section>
  );
}
