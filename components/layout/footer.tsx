import Link from "next/link";

const groups = [
  { heading: "Product", links: [{ label: "Apps", href: "/#apps" }, { label: "Credits", href: "https://credits.34cats.com" }, { label: "Sign in", href: "/login" }] },
  { heading: "About Me", links: [{ label: "Portfolio", href: "https://34cats.com" }, { label: "Writing", href: "https://blog.34cats.com" }, { label: "GitHub", href: "https://github.com/seanrh34" }] },
  { heading: "Legal", links: [{ label: "Privacy", href: "/privacy-policy" }, { label: "Terms", href: "/terms-of-service" }] },
];

export function Footer() {
  return (
    <footer className="border-t border-rail bg-platform-raised px-5 py-12 md:px-8 md:py-16">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1.5fr_repeat(3,1fr)]">
        <div>
          <p className="portal-heading text-2xl">34cats</p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-copy-muted">Practical apps, built to show what I can do.</p>
          <a href="mailto:34cats.dev@gmail.com" className="mt-5 inline-block text-sm text-signal underline underline-offset-4">34cats.dev@gmail.com</a>
        </div>
        {groups.map((group) => (
          <div key={group.heading}>
            <p className="portal-label text-copy">{group.heading}</p>
            <ul className="mt-4 space-y-3">
              {group.links.map((link) => (
                <li key={link.label}>
                  {link.href.startsWith("http") ? (
                    <a href={link.href} target="_blank" rel="noopener noreferrer" className="text-sm text-copy-muted hover:text-copy">{link.label} <span aria-hidden="true">↗</span></a>
                  ) : (
                    <Link href={link.href} className="text-sm text-copy-muted hover:text-copy">{link.label}</Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-12 flex max-w-6xl flex-col gap-2 border-t border-rail pt-6 text-xs text-copy-muted sm:flex-row sm:justify-between">
        <p>© {new Date().getFullYear()} 34cats</p>
        <p>Built and maintained by Sean.</p>
      </div>
    </footer>
  );
}
