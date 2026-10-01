import type { ReactNode } from "react";

/** Bandeau d'en-tête des pages intérieures (fond clair, sous le header fixe). */
export function PageIntro({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="bg-cream pt-[calc(var(--header-h)+48px)] pb-12 lg:pt-[calc(var(--header-h)+80px)] lg:pb-16">
      <div className="container-x">
        <h1 className="display text-[clamp(3.4rem,10vw,7rem)] text-deep">{title}</h1>
        {children && <div className="mt-5 max-w-[46ch] text-lg text-slate">{children}</div>}
      </div>
    </div>
  );
}
