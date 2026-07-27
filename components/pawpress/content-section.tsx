import { ReactNode } from "react";

interface ContentSectionProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function ContentSection({ title, children, className = "" }: ContentSectionProps) {
  return (
    <section className={`mb-20 ${className}`}>
      <h2 className="mb-8 font-display text-3xl text-bone md:text-4xl">
        {title}
      </h2>
      <div className="space-y-5 leading-relaxed text-ash">{children}</div>
    </section>
  );
}
