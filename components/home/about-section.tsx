const links = [
  {
    label: "Portfolio",
    value: "34cats.com",
    href: "https://34cats.com",
    note: "The rest of the work, including what never got parked here.",
  },
  {
    label: "Writing",
    value: "blog.34cats.com",
    href: "https://blog.34cats.com",
    note: "Notes on what I'm building, running on PawPress.",
  },
  {
    label: "Email",
    value: "34cats.dev@gmail.com",
    href: "mailto:34cats.dev@gmail.com",
    note: "Collaborations, bug reports, or just to say hello.",
  },
];

export function AboutSection() {
  return (
    <section id="about" className="px-6 py-20 md:py-28">
      <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-[1fr_1.4fr] md:gap-20">
        <div>
          <p className="label text-ash-dim">About</p>
          <h2 className="mt-4 font-display text-4xl leading-tight text-bone md:text-5xl">
            You can&apos;t spell{" "}
            <span className="italic text-ember">functional</span> without fun.
          </h2>
        </div>

        <div>
          <p className="text-lg leading-relaxed text-bone">
            I&apos;m Sean. I build these on evenings and weekends, mostly
            because I wanted them to exist and nobody else had made the version
            I had in mind.
          </p>
          <p className="mt-5 leading-relaxed text-ash">
            Some of them started as an excuse to learn something new. That
            never became an excuse to ship something careless — if an app is
            here, I use it myself, and it holds up. Fun to make and functional
            aren&apos;t opposites; the first one is why the second one gets
            finished.
          </p>

          <dl className="mt-12 border-t border-line">
            {links.map((link) => (
              <div
                key={link.label}
                className="grid gap-1 border-b border-line py-5 sm:grid-cols-[7rem_1fr] sm:gap-6"
              >
                <dt className="label pt-1 text-ash-dim">{link.label}</dt>
                <dd>
                  <a
                    href={link.href}
                    target={link.href.startsWith("http") ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    className="font-medium text-bone underline decoration-line-strong underline-offset-4 transition-colors hover:text-ember hover:decoration-ember"
                  >
                    {link.value}
                  </a>
                  <p className="mt-1 text-sm text-ash">{link.note}</p>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
