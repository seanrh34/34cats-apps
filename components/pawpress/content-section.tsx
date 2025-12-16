import { ReactNode } from "react";

interface ContentSectionProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function ContentSection({ title, children, className = "" }: ContentSectionProps) {
  return (
    <section className={`mb-16 ${className}`}>
      <h2 className="text-3xl font-bold text-white mb-6">
        {title}
      </h2>
      <div className="text-gray-300 space-y-4 leading-relaxed">
        {children}
      </div>
    </section>
  );
}
