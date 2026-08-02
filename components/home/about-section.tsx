const links = [
  { label: "Portfolio", value: "34cats.com", href: "https://34cats.com", note: "Other projects and client work." },
  { label: "Writing", value: "blog.34cats.com", href: "https://blog.34cats.com", note: "Notes on building and maintaining things." },
  { label: "Contact", value: "34cats.dev@gmail.com", href: "mailto:34cats.dev@gmail.com", note: "Questions, bug reports, or a quick hello." },
];

export function AboutSection() {
  return (
    <section id="about" className="px-5 py-20 md:px-8 md:py-28">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
        <div>
          <h2 className="portal-heading mt-2 text-4xl text-copy md:text-5xl">About these apps and the 34cats domain.</h2>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-copy-muted">I&apos;m Sean. I build these apps because I believe there is no
            better way to demonstrate what I&apos;ve learned other than via shipping a product. Feel free to send feedback to
            &nbsp;<a href="mailto:34cats.dev@gmail.com" className="text-signal underline">34cats.dev@gmail.com</a> as I'm always looking to improve.
          </p>
        </div>
        <div className="portal-panel overflow-hidden">
          {links.map((link) => {
            const isExternal = link.href.startsWith("http");
            return (
              <a
                key={link.label}
                href={link.href}
                {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="group block border-b border-rail p-5 last:border-b-0 transition-colors duration-150 hover:bg-surface-subtle sm:grid sm:grid-cols-[7rem_1fr] sm:gap-6"
              >
                <span className="portal-label text-copy-muted transition-colors duration-150 group-hover:text-signal">{link.label}</span>
                <div className="mt-2 sm:mt-0">
                  <span className="font-medium text-copy transition-colors duration-150 group-hover:text-signal">
                    {link.value}{isExternal && <span aria-hidden="true"> ↗</span>}
                  </span>
                  <p className="mt-1 text-sm text-copy-muted">{link.note}</p>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
