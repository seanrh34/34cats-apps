import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";

const groups = [
  { heading: "Product", links: [{ label: "Apps", href: "/#apps" }, { label: "Credits", href: "https://credits.34cats.com" }, { label: "Sign in", href: "/login" }] },
  { heading: "About Me", links: [{ label: "Portfolio", href: "https://34cats.com" }, { label: "Writing", href: "https://blog.34cats.com" }, { label: "GitHub", href: "https://github.com/seanrh34" }] },
  { heading: "Legal", links: [{ label: "Privacy", href: "/privacy-policy" }, { label: "Terms", href: "/terms-of-service" }] },
];

const linkClass = "inline-flex min-h-11 min-w-11 items-center text-sm text-copy-muted transition-colors hover:text-signal";

export function Footer() {
  return (
    <footer className="overflow-hidden border-t border-rail bg-platform-raised px-5 pt-12 md:px-8 md:pt-16">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1.5fr_repeat(3,1fr)]">
        <div>
          <p className="portal-heading text-2xl">34cats</p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-copy-muted">Practical apps, built to show what I can do.</p>
          <a href="mailto:34cats.dev@gmail.com" className="mt-5 inline-flex min-h-11 items-center text-sm text-signal underline underline-offset-4">34cats.dev@gmail.com</a>
        </div>
        {groups.map((group) => (
          <div key={group.heading}>
            <p className="portal-label text-copy">{group.heading}</p>
            <ul className="mt-3">
              {group.links.map((link) => (
                <li key={link.label}>
                  {link.href.startsWith("http") ? (
                    <a href={link.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
                      {link.label}&nbsp;<span aria-hidden="true">↗</span>
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  ) : (
                    <Link href={link.href} className={linkClass}>{link.label}</Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-10 flex max-w-6xl flex-col gap-2 border-t border-rail pt-6 text-xs text-copy-muted sm:flex-row sm:justify-between">
        <p>© {new Date().getFullYear()} 34cats</p>
        <p>Built and maintained by Sean.</p>
      </div>
      <Reveal variant="fade" className="wordmark-wrap relative mx-auto mt-8 max-w-6xl select-none overflow-hidden text-[clamp(5rem,26vw,19rem)]" style={{ height: "0.62em" }}>
        <span className="wordmark block" aria-hidden="true">34cats</span>
        <span className="wordmark wordmark-fill" aria-hidden="true">34cats</span>
      </Reveal>
    </footer>
  );
}
