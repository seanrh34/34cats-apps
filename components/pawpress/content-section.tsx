import { ReactNode } from "react";

interface ContentSectionProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function ContentSection({ title, children, className = "" }: ContentSectionProps) {
  return (
    <section className={`mb-16 border-t border-rail pt-7 ${className}`}>
      <h2 className="portal-heading text-3xl text-copy md:text-4xl">{title}</h2>
      <div className="mt-6 max-w-[70ch] space-y-5 leading-relaxed text-copy-muted">{children}</div>
    </section>
  );
}
