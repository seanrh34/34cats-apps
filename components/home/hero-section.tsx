export function HeroSection() {
  return (
    <section id="home" className="px-5 pb-14 pt-16 md:px-8 md:pb-20 md:pt-24">
      <div className="mx-auto max-w-4xl text-center">
        <p className="hero-label portal-label text-signal">Software Projects by Sean</p>
        <h1 className="hero-line-1 portal-heading mt-5 text-[clamp(3rem,8vw,5.5rem)] leading-none tracking-[-0.035em] text-copy">
          Practical tools you can use right now.
        </h1>
        <p className="hero-line-2 mx-auto mt-4 text-lg italic text-copy-muted">
          My testing grounds, your playground.
        </p>
        <p className="hero-body mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-copy-muted">
          Tools that I built to learn new technologies. Experience the results of my learning,
          as I build new tools for the new technologies I explore.
        </p>
        <div className="hero-actions mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <a href="#apps" className="portal-button portal-button-primary">Explore the apps</a>
          <a href="https://credits.34cats.com" target="_blank" rel="noopener noreferrer" className="portal-button portal-button-secondary">Learn about credits <span aria-hidden="true">↗</span></a>
        </div>
      </div>
    </section>
  );
}
