import Link from "next/link";

const columns = [
  {
    heading: "Site",
    links: [
      { name: "Apps", href: "/#apps" },
      { name: "About", href: "/#about" },
      { name: "Sign in", href: "/login" },
    ],
  },
  {
    heading: "Elsewhere",
    links: [
      { name: "34cats.com", href: "https://34cats.com" },
      { name: "Blog", href: "https://blog.34cats.com" },
      { name: "GitHub", href: "https://github.com/seanrh34" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { name: "Privacy Policy", href: "/privacy-policy" },
      { name: "Terms of Service", href: "/terms-of-service" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-line px-6 py-16">
      <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-[1.5fr_repeat(3,1fr)]">
        <div>
          <p className="font-display text-2xl text-bone">34cats</p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-ash">
            Small, useful software, built by hand and kept that way.
          </p>
          <a
            href="mailto:34cats.dev@gmail.com"
            className="mt-5 inline-block text-sm text-ash underline decoration-line-strong underline-offset-4 transition-colors hover:text-ember hover:decoration-ember"
          >
            34cats.dev@gmail.com
          </a>
        </div>

        {columns.map((column) => (
          <div key={column.heading}>
            <h3 className="label text-ash-dim">{column.heading}</h3>
            <ul className="mt-5 space-y-3">
              {column.links.map((link) => (
                <li key={link.name}>
                  {link.href.startsWith("http") ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-ash transition-colors hover:text-ember"
                    >
                      {link.name}
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      className="text-sm text-ash transition-colors hover:text-ember"
                    >
                      {link.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-16 flex max-w-6xl flex-col gap-2 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="label text-ash-dim">
          © {new Date().getFullYear()} 34cats
        </p>
        <p className="label text-ash-dim">Built in the evenings</p>
      </div>
    </footer>
  );
}
