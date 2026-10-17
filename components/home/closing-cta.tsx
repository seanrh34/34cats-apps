import { PeekingCat } from "@/components/brand/cat";
import { Reveal } from "@/components/motion/reveal";

export function ClosingCta() {
  return (
    <section className="px-5 pb-20 pt-24 md:px-8 md:pb-28 md:pt-28">
      <Reveal className="relative mx-auto max-w-6xl">
        <PeekingCat className="absolute bottom-[calc(100%-1px)] left-[10%] w-28 md:left-[14%] md:w-36" />
        <div className="rounded-[28px] bg-[var(--cta-bg)] px-7 py-14 text-[var(--cta-fg)] md:px-16 md:py-20">
          <p className="portal-label opacity-80">Pick one and try it</p>
          <h2 className="portal-heading mt-4 max-w-3xl text-[clamp(2.25rem,6vw,4.5rem)] leading-[1] tracking-[-0.04em]">
            Free to use or free to try. No credit card required.
          </h2>
          <p className="mt-5 max-w-xl text-lg leading-relaxed opacity-80">Open an app and bookmark it if you like it.</p>
          <div className="mt-9">
            <a href="#apps" className="portal-button portal-button-inverse">
              Browse the apps
            </a>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
