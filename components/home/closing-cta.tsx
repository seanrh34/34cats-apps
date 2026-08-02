export function ClosingCta() {
  return (
    <section className="border-t border-rail bg-platform-raised px-5 py-16 text-center md:px-8 md:py-20">
      <div className="mx-auto max-w-2xl">
        <p className="portal-label text-signal">Pick one and try it</p>
        <h2 className="portal-heading mt-3 text-3xl text-copy md:text-4xl">Free to use or free to try.<br/>No credit card required.</h2>
        <p className="mx-auto mt-4 max-w-xl leading-relaxed text-copy-muted">
          Open an app and bookmark it if you like it.
        </p>
        <div className="mt-8">
          <a href="#apps" className="portal-button portal-button-primary">Browse the apps</a>
        </div>
      </div>
    </section>
  );
}
