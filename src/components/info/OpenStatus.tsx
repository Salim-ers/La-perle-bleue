"use client";

import { useEffect, useState } from "react";
import { restaurant } from "@/data/restaurant";
import { getOpenStatus, type OpenStatus as Status } from "@/lib/hours";
import { cn } from "@/lib/utils";

/** Pastille « Ouvert / Fermé » calculée à l'heure de Paris, côté client. */
export function OpenStatus({ className, tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    const update = () => setStatus(getOpenStatus(restaurant.openingHours));
    update();
    const id = window.setInterval(update, 60_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <p
      className={cn(
        "inline-flex min-h-8 items-center gap-2.5 rounded-full px-3.5 text-sm font-medium",
        tone === "dark" ? "bg-white/8 text-white" : "bg-deep/6 text-night",
        className,
      )}
      aria-live="polite"
    >
      <span
        aria-hidden="true"
        className={cn(
          "size-2 rounded-full",
          !status && "bg-current opacity-30",
          status?.open && "bg-nazar shadow-[0_0_0_4px_rgba(140,200,242,0.22)]",
          status && !status.open && "bg-sand",
        )}
      />
      <span className={cn(!status && "opacity-0")}>{status?.label ?? "Horaires du jour"}</span>
    </p>
  );
}
