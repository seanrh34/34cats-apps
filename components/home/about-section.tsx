import type { CSSProperties } from "react";
import { Reveal } from "@/components/motion/reveal";

const links = [
  { label: "Portfolio", value: "34cats.com", href: "https://34cats.com", note: "Other projects and client work.", tint: "var(--butter)" },
  { label: "Writing", value: "blog.34cats.com", href: "https://blog.34cats.com", note: "Notes on building and maintaining things.", tint: "var(--sage)" },
  { label: "Contact", value: "34cats.dev@gmail.com", href: "mailto:34cats.dev@gmail.com", note: "Questions, bug reports, or a quick hello.", tint: "var(--lilac)" },
];

export function AboutSection() {
  return (
    <section id="about" className="px-5 py-16 md:px-8 md:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
        <Reveal variant="tilt" tilt="-3deg" className="relative">
          <div className="note-card relative rounded-panel border border-rail-strong bg-platform-raised p-7 pt-10 md:p-10 md:pt-12">
            <span className="note-tape" aria-hidden="true" />
            <p className="portal-label text-signal">About these apps and the 34cats domain</p>
            <h2 className="portal-heading mt-3 text-5xl text-copy md:text-6xl">Hi, I&apos;m Sean.</h2>
            <p className="mt-6 text-lg leading-relaxed text-copy-muted">
              I build these apps because I believe there is no better way to demonstrate what I&apos;ve learned than by
              shipping a product. Feel free to send feedback to{" "}
              <a href="mailto:34cats.dev@gmail.com" className="font-medium text-signal underline underline-offset-4">34cats.dev@gmail.com</a>
              {" "}— I&apos;m always looking to improve.
            </p>
          </div>
        </Reveal>
        <Reveal delay={150} className="portal-panel overflow-hidden">
          {links.map((link) => {
            const isExternal = link.href.startsWith("http");
            return (
              <a
                key={link.label}
                href={link.href}
                {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                style={{ "--row-tint": link.tint } as CSSProperties}
                className="link-row group flex items-center justify-between gap-4 border-b border-rail p-6 last:border-b-0 sm:px-8"
              >
                <span className="min-w-0">
                  <span className="portal-label block text-copy-muted">{link.label}</span>
                  <span className="portal-heading mt-1.5 block break-words text-xl text-copy sm:text-2xl md:text-3xl">{link.value}</span>
                  <span className="mt-1 block text-sm text-copy-muted">{link.note}</span>
                </span>
                <span className="row-arrow shrink-0 text-2xl text-copy" aria-hidden="true">{isExternal ? "↗" : "→"}</span>
              </a>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
}
