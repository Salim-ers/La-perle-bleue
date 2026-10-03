"use client";

import { Clock, Store, Timer } from "lucide-react";
import { useEffect, useState } from "react";
import { restaurant } from "@/data/restaurant";
import { useOrderingState } from "@/features/live/store";
import { WEEK, formatRanges, getOpenStatus, parisNow, type OpenStatus } from "@/lib/hours";
import { cn } from "@/lib/utils";

/**
 * Bandeau sous le header : ouvert / fermé, horaires du jour, retrait, temps estimé.
 * Calculé à l'heure de Paris côté navigateur (le HTML statique ne connaît pas l'heure).
 */
export function InfoBar({ className }: { className?: string }) {
  const [state, setState] = useState<{ status: OpenStatus; today: string } | null>(null);

  useEffect(() => {
    const update = () => {
      const now = parisNow();
      setState({
        status: getOpenStatus(restaurant.openingHours, now),
        today: formatRanges(restaurant.openingHours[WEEK[now.dayIndex].id]),
      });
    };
    update();
    const id = window.setInterval(update, 60_000);
    return () => window.clearInterval(id);
  }, []);

  const ordering = useOrderingState();
  const open = state?.status.open;
  const item = "flex shrink-0 items-center gap-2";

  return (
    <div className={cn("border-b border-line bg-white text-night", className)}>
      <ul
        aria-label="Informations pratiques"
        className="no-scrollbar container-x flex h-11 items-center gap-x-6 overflow-x-auto text-[13.5px] whitespace-nowrap lg:justify-center lg:gap-x-10"
      >
        <li className={item} aria-live="polite">
          <span
            aria-hidden="true"
            className={cn(
              "relative size-2.5 rounded-full",
              !state && "bg-night/20",
              open && "bg-leaf shadow-[0_0_0_4px_rgba(21,128,61,0.16)]",
              state && !open && "bg-ember/80",
            )}
          />
          <span className={cn(!state && "invisible")}>
            <strong className={cn("font-bold tracking-[0.06em] uppercase", open ? "text-leaf" : "text-night")}>
              {open ? "Ouvert" : "Fermé"}
            </strong>
            {state && !open && (
              <span className="text-slate"> · {state.status.label.replace(/^Fermé,?\s*/, "")}</span>
            )}
          </span>
        </li>
        <li className={item}>
          <Clock className="size-4 text-royal" aria-hidden="true" />
          <span className={cn(!state && "invisible")}>
            Aujourd&apos;hui : <strong className="font-semibold">{state?.today ?? "11 h – 23 h"}</strong>
          </span>
        </li>
        <li className={item}>
          <Store className="size-4 text-royal" aria-hidden="true" />
          Retrait sur place
        </li>
        <li className={item}>
          <Timer className="size-4 text-royal" aria-hidden="true" />
          {ordering.known && !ordering.canOrder ? (
            <strong className="font-semibold text-ember">{ordering.message}</strong>
          ) : (
            <>
              Temps estimé : <strong className="font-semibold">{ordering.preparationDelay}&nbsp;min</strong>
            </>
          )}
        </li>
      </ul>
    </div>
  );
}
