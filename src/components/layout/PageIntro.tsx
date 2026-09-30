import type { ReactNode } from "react";

/** Bandeau d'en-tête des pages intérieures (fond nuit, sous le header transparent). */
export function PageIntro({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="grain bg-night pt-[calc(var(--header-h)+56px)] pb-14 lg:pt-[calc(var(--header-h)+88px)] lg:pb-20">
      <div className="container-x">
        <h1 className="display text-[clamp(3.4rem,10vw,7rem)] text-white">{title}</h1>
        {children && <div className="mt-5 max-w-[46ch] text-lg text-white/80">{children}</div>}
      </div>
    </div>
  );
}
