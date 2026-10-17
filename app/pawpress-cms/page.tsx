import type { Metadata } from "next";
import { PeekingCat } from "@/components/brand/cat";
import { Reveal } from "@/components/motion/reveal";
import { ProjectHero } from "@/components/pawpress/project-hero";

export const metadata: Metadata = {
  title: "PawPress CMS | 34cats",
  description:
    "Fork an MIT-licensed Next.js blog CMS with a Lexical editor, Supabase-backed content, and a complete admin dashboard.",
};

const outcomes = [
  {
    title: "A focused writing experience",
    description:
      "Write, format, categorize, and publish posts in a Lexical-powered editor with image uploads, video embeds, code blocks, drafts, and featured images.",
  },
  {
    title: "A complete blog foundation",
    description:
      "Start with the public blog, admin dashboard, post and category management, SEO-friendly routes, metadata, and API endpoints already connected.",
  },
  {
    title: "Code you can take apart",
    description:
      "PawPress is an MIT-licensed repository, not a hosted CMS. Fork it, change the schema, reshape the editor, and deploy it with your application.",
  },
];

const steps = [
  {
    title: "Fork the repository",
    description:
      "Use PawPress as a starting point for your blog instead of integrating a separate CMS product.",
  },
  {
    title: "Connect Supabase",
    description:
      "Create a Supabase project, add the documented tables and storage bucket, then set the required environment variables.",
  },
  {
    title: "Make it yours",
    description:
      "Change the visual design, content model, editor controls, roles, and publishing flow in the same Next.js codebase.",
  },
  {
    title: "Deploy and publish",
    description:
      "Deploy the application to Vercel or your preferred Next.js host, then manage posts from the included admin dashboard.",
  },
];

const included = [
  "Next.js 15 App Router project",
  "Lexical rich-text editor",
  "Post, category, image, and user management",
  "Public blog pages and SEO metadata",
  "Supabase database and storage setup",
  "Vercel-ready deployment structure",
];

const prerequisites = [
  "Node.js 18 or newer",
  "A Supabase project and credentials",
  "A hosting account for the Next.js application",
  "Comfort working in a TypeScript codebase",
];

export default function PawPressCMSPage() {
  return (
    <main className="px-5 py-10 md:px-8 md:py-16">
      <div className="mx-auto max-w-6xl">
        <ProjectHero />

        <Reveal as="section"
          aria-labelledby="proof-title"
          className="grid gap-8 border-b border-rail py-14 md:py-20 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16"
        >
          <div>
            <p className="portal-label text-signal">Live proof</p>
            <h2
              id="proof-title"
              className="portal-heading mt-3 max-w-lg text-3xl leading-tight text-copy md:text-4xl"
            >
              The framework behind the 34cats blog.
            </h2>
          </div>
          <div className="max-w-[65ch]">
            <p className="text-lg leading-relaxed text-copy-muted">
              PawPress is not a hosted service or a mockup. I use it to write
              and publish the posts on my live blog. Browse the output first;
              if the approach fits your project, the complete implementation
              is available to clone or fork.
            </p>
            <a
              href="https://blog.34cats.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex min-h-11 items-center gap-2 font-semibold text-signal underline decoration-1 underline-offset-4 hover:text-copy"
            >
              Browse the live blog
              <span aria-hidden="true">↗</span>
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </div>
        </Reveal>

        <Reveal as="section" aria-labelledby="outcomes-title" className="py-14 md:py-20">
          <div className="max-w-2xl">
            <p className="portal-label text-signal">What you get</p>
            <h2
              id="outcomes-title"
              className="portal-heading mt-3 text-3xl leading-tight text-copy md:text-4xl"
            >
              Enough CMS to launch. Plain enough to change.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-copy-muted">
              PawPress gives developers a working blog stack without putting a
              proprietary CMS between their content and their application.
            </p>
          </div>

          <dl className="mt-10 grid border-y border-rail lg:grid-cols-3">
            {outcomes.map((outcome, index) => (
              <div
                key={outcome.title}
                className={`py-7 lg:px-8 lg:py-9 ${
                  index > 0 ? "border-t border-rail lg:border-t-0 lg:border-l" : ""
                }`}
              >
                <dt className="portal-heading text-xl text-copy">
                  {outcome.title}
                </dt>
                <dd className="mt-3 leading-relaxed text-copy-muted">
                  {outcome.description}
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>

        <Reveal as="section"
          aria-labelledby="workflow-title"
          className="grid gap-10 border-y border-rail py-14 md:py-20 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20"
        >
          <div>
            <p className="portal-label text-signal">From fork to first post</p>
            <h2
              id="workflow-title"
              className="portal-heading mt-3 max-w-md text-3xl leading-tight text-copy md:text-4xl"
            >
              A starting point, not another platform to manage.
            </h2>
            <p className="mt-5 max-w-md leading-relaxed text-copy-muted">
              The repository documents the database schema, environment
              variables, local setup, and deployment path. You own the work
              that follows.
            </p>
          </div>

          <Reveal variant="draw" className="relative">
            <div className="draw-line-y dash-line-y pointer-events-none absolute left-[2.1rem] top-8 bottom-8 w-0.5" aria-hidden="true" />
            <ol className="relative">
              {steps.map((step, index) => (
                <Reveal as="li" variant="tilt" tilt={index % 2 ? "1deg" : "-1deg"} delay={index * 100} key={step.title} className="flex gap-5 py-5">
                  <span
                    className="relative z-10 block h-14 w-[4.5rem] shrink-0 bg-platform pr-3 font-mono text-5xl font-medium leading-[3.5rem] text-transparent"
                    style={{ WebkitTextStroke: "1.5px var(--text)" }}
                    aria-hidden="true"
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="pt-1">
                    <h3 className="portal-heading text-2xl text-copy">{step.title}</h3>
                    <p className="mt-2 max-w-[65ch] text-lg leading-relaxed text-copy-muted">{step.description}</p>
                  </div>
                </Reveal>
              ))}
            </ol>
          </Reveal>
        </Reveal>

        <Reveal as="section" aria-labelledby="clone-title" className="py-14 md:py-20">
          <div className="max-w-2xl">
            <p className="portal-label text-signal">Know what you are cloning</p>
            <h2
              id="clone-title"
              className="portal-heading mt-3 text-3xl leading-tight text-copy md:text-4xl"
            >
              The application is included. The infrastructure is yours.
            </h2>
          </div>

          <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:gap-16">
            <div className="border-t border-rail pt-6">
              <h3 className="portal-heading text-xl text-copy">In the repository</h3>
              <ul className="mt-5 space-y-3 text-copy-muted">
                {included.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-live" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="border-t border-rail pt-6">
              <h3 className="portal-heading text-xl text-copy">You provide</h3>
              <ul className="mt-5 space-y-3 text-copy-muted">
                {prerequisites.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-signal" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p className="mt-8 max-w-[70ch] rounded-control bg-surface-subtle px-5 py-4 text-sm leading-relaxed text-copy-muted">
            PawPress does not add a CMS subscription or proprietary content
            API. Supabase and your hosting provider may have their own pricing,
            usage limits, and operational requirements.
          </p>
        </Reveal>

        <Reveal as="section"
          aria-labelledby="fit-title"
          className="grid gap-10 border-t border-rail py-14 md:py-20 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20"
        >
          <div>
            <p className="portal-label text-signal">Choose it for the right job</p>
            <h2
              id="fit-title"
              className="portal-heading mt-3 text-3xl leading-tight text-copy md:text-4xl"
            >
              Best when ownership matters more than convenience.
            </h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-2">
            <div className="border-t border-rail pt-5">
              <h3 className="portal-heading text-lg text-copy">A good fit</h3>
              <p className="mt-3 leading-relaxed text-copy-muted">
                Next.js developers building a blog or content-led site who want
                a working editor and a codebase they can fully customize.
              </p>
            </div>
            <div className="border-t border-rail pt-5">
              <h3 className="portal-heading text-lg text-copy">Choose something else</h3>
              <p className="mt-3 leading-relaxed text-copy-muted">
                Teams that need a no-code site builder, complex relational
                content models, a plugin marketplace, or managed CMS support.
              </p>
            </div>
          </div>
        </Reveal>

        <Reveal className="relative mt-16 md:mt-20">
          <PeekingCat className="absolute bottom-[calc(100%-1px)] right-[8%] w-24 md:w-32" />
          <section className="rounded-[28px] bg-[var(--cta-bg)] px-6 py-10 text-[var(--cta-fg)] md:px-12 md:py-14 lg:flex lg:items-end lg:justify-between lg:gap-12">
            <div className="max-w-2xl">
              <p className="portal-label opacity-80">Ready to inspect the code?</p>
              <h2 className="portal-heading mt-3 text-3xl leading-tight md:text-5xl">
                See the result. Then fork the implementation.
              </h2>
              <p className="mt-4 max-w-[60ch] leading-relaxed opacity-80">
                Start with the live 34cats blog, or go directly to the MIT-licensed
                repository and adapt PawPress for your own project.
              </p>
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row lg:mt-0 lg:shrink-0">
              <a
                href="https://blog.34cats.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="portal-button portal-button-inverse"
              >
                Visit the live blog
                <span aria-hidden="true">↗</span>
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
              <a
                href="https://github.com/seanrh34/PawPress/fork"
                target="_blank"
                rel="noopener noreferrer"
                className="portal-button portal-button-inverse-outline"
              >
                Fork on GitHub
                <span aria-hidden="true">↗</span>
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </div>
          </section>
        </Reveal>
      </div>
    </main>
  );
}
