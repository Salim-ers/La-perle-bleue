"use client";

import { m } from "framer-motion";
import type { ReactNode } from "react";

/** Apparition discrète à l'entrée dans l'écran. À utiliser avec parcimonie. */
export function Reveal({
  children,
  className,
  delay = 0,
  variant = "fade-up",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  variant?: "fade-up" | "clip";
}) {
  if (variant === "clip") {
    return (
      <m.div
        className={className}
        initial={{ clipPath: "inset(10% 10% 10% 10%)", opacity: 0.5 }}
        whileInView={{ clipPath: "inset(0% 0% 0% 0%)", opacity: 1 }}
        viewport={{ once: true, margin: "-12% 0px" }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay }}
      >
        {children}
      </m.div>
    );
  }
  return (
    <m.div
      className={className}
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </m.div>
  );
}
