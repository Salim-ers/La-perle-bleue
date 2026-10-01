"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 20,
  label,
  size = "md",
  className,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  /** Nom du produit, pour les lecteurs d'écran. */
  label: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const btn = cn(
    "grid shrink-0 place-items-center rounded-full text-night transition-colors hover:bg-night/8 active:scale-95 disabled:opacity-30 disabled:hover:bg-transparent",
    size === "sm" ? "size-9" : "size-11",
  );
  return (
    <div
      role="group"
      aria-label={`Quantité : ${label}`}
      className={cn("inline-flex items-center rounded-full border border-line bg-white", className)}
    >
      <button
        type="button"
        className={btn}
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        aria-label="Diminuer la quantité"
      >
        <Minus className="size-4" aria-hidden="true" />
      </button>
      <output aria-live="polite" className={cn("min-w-7 text-center font-bold tabular-nums", size === "sm" ? "text-[15px]" : "text-base")}>
        {value}
      </output>
      <button
        type="button"
        className={btn}
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label="Augmenter la quantité"
      >
        <Plus className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
