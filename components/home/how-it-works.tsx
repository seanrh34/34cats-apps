import { Reveal } from "@/components/motion/reveal";

const steps = [
  { title: "Pick a chore", body: "Start with an ordinary task that could be quicker." },
  { title: "Ship it for real", body: "Build it with tech I want to learn, and put it live." },
  { title: "Keep it running", body: "Launch is the start of maintenance, not the finish." },
];

export function HowItWorks() {
  return (
    <section className="px-5 py-16 md:px-8 md:py-24" aria-labelledby="how-title">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <p className="portal-label text-signal">How these get made</p>
          <h2 id="how-title" className="sr-only">How these apps get made</h2>
        </Reveal>
        <Reveal variant="draw" className="relative mt-10">
          <div
            className="draw-line dash-line pointer-events-none absolute left-[1.8rem] top-6 bottom-6 w-0.5 md:bottom-auto md:left-6 md:right-6 md:top-[1.75rem] md:h-0.5 md:w-auto"
            aria-hidden="true"
          />
          <ol className="relative grid gap-10 md:grid-cols-3 md:gap-8">
            {steps.map((step, i) => (
              <li key={step.title} className="flex gap-5 md:block">
                <span
                  className="relative z-10 block h-14 w-[4.5rem] shrink-0 bg-platform pr-3 font-mono text-5xl font-medium leading-[3.5rem] text-transparent md:inline-block md:w-auto md:pr-5"
                  style={{ WebkitTextStroke: "1.5px var(--text)" }}
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="md:mt-6">
                  <h3 className="portal-heading text-2xl text-copy md:text-3xl">{step.title}</h3>
                  <p className="mt-2 max-w-xs leading-relaxed text-copy-muted">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </Reveal>
      </div>
    </section>
  );
}
