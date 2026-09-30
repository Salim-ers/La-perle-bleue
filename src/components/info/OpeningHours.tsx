"use client";

import { useEffect, useState } from "react";
import { restaurant } from "@/data/restaurant";
import { WEEK, formatRanges, parisNow } from "@/lib/hours";
import { cn } from "@/lib/utils";

export function OpeningHours({ tone = "light" }: { tone?: "light" | "dark" }) {
  const [today, setToday] = useState<number | null>(null);
  useEffect(() => setToday(parisNow().dayIndex), []);

  return (
    <dl className="divide-y divide-current/10">
      {WEEK.map((d, i) => {
        const isToday = i === today;
        const ranges = restaurant.openingHours[d.id];
        return (
          <div
            key={d.id}
            className={cn(
              "flex items-baseline justify-between gap-6 py-2.5 text-[15px]",
              isToday && (tone === "light" ? "font-semibold text-deep" : "font-semibold text-sand"),
            )}
          >
            <dt className="flex items-center gap-2">
              {d.label}
              {isToday && (
                <span className={cn("text-xs font-medium", tone === "light" ? "text-royal" : "text-nazar")}>
                  aujourd&apos;hui
                </span>
              )}
            </dt>
            <dd className={cn("tabular-nums", ranges.length === 0 && "opacity-60")}>
              {formatRanges(ranges)}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
