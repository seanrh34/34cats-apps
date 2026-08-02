import { ReactNode } from "react";

interface LegalDocumentProps { title: string; children: ReactNode; }

export function LegalDocument({ title, children }: LegalDocumentProps) {
  return (
    <main className="min-h-screen px-5 py-12 md:px-8 md:py-20">
      <article className="mx-auto max-w-4xl">
        <header className="mb-12 border-b border-rail pb-8">
          <p className="portal-label text-signal">34cats legal</p>
          <h1 className="portal-heading mt-3 text-4xl text-copy md:text-6xl">{title}</h1>
        </header>
        <div className="legal-document">{children}</div>
      </article>
    </main>
  );
}
