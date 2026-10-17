import { Reveal } from "@/components/motion/reveal";

const steps = [
  { title: "Pick a chore", body: "Start with an ordinary task that could be quicker." },
  { title: "Ship it for real", body: "Build it with tech I want to learn, and put it live." },
  { title: "Keep it running", body: "Launch is the start of maintenance, not the finish." },
];

export function HowItWorks() {
  return (
    <section className="px-5 py-16 md:px-8 md:py-32" aria-labelledby="how-title">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <p className="portal-label text-signal">How these get made</p>
          <h2 id="how-title" className="sr-only">How these apps get made</h2>
        </Reveal>
        <Reveal variant="draw" className="relative mt-10">
          <div
            className="draw-line dash-line pointer-events-none absolute left-[1.8rem] top-6 bottom-6 w-0.5 md:bottom-auto md:left-6 md:right-6 md:top-[2.5rem] md:h-0.5 md:w-auto"
            aria-hidden="true"
          />
          <ol className="relative grid gap-10 md:grid-cols-3 md:gap-8">
            {steps.map((step, i) => (
              <Reveal as="li" variant="tilt" tilt={i % 2 ? "1.5deg" : "-1.5deg"} delay={i * 150} key={step.title} className="flex gap-5 md:block">
                <span
                  className="relative z-10 block h-14 w-[4.5rem] shrink-0 bg-platform pr-3 font-mono text-5xl font-medium leading-[3.5rem] text-transparent md:inline-block md:h-20 md:w-auto md:pr-6 md:text-7xl md:leading-[5rem]"
                  style={{ WebkitTextStroke: "1.5px var(--text)" }}
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="md:mt-7">
                  <h3 className="portal-heading text-3xl text-copy md:text-4xl">{step.title}</h3>
                  <p className="mt-3 max-w-sm text-lg leading-relaxed text-copy-muted">{step.body}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </Reveal>
      </div>
    </section>
  );
}
