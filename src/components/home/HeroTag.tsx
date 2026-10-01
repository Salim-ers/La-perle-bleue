"use client";

import { Plus } from "lucide-react";
import { formatPrice, spokenPrice } from "@/data/menu";
import { startOrder } from "@/features/cart/ui";
import { cn } from "@/lib/utils";

/** Étiquette posée sur une photo du hero : nom, prix, ajout direct. */
export function HeroTag({
  productId,
  name,
  kicker,
  price,
  className,
}: {
  productId: string;
  name: string;
  kicker: string;
  price: number;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => startOrder(productId)}
      aria-label={`Ajouter au panier : ${name}, ${spokenPrice(price)}`}
      className={cn(
        "group inline-flex items-center gap-3 rounded-full bg-white/95 py-1.5 pr-1.5 pl-4 text-left text-night shadow-[0_16px_36px_-16px_rgba(6,19,46,0.6)] backdrop-blur transition-transform duration-300 ease-[var(--ease-soft)] hover:-translate-y-0.5",
        className,
      )}
    >
      <span className="leading-tight">
        <span className="block text-[10.5px] font-bold tracking-[0.12em] text-royal uppercase">{kicker}</span>
        <span className="block text-[15px] font-bold">{name}</span>
      </span>
      <span aria-hidden="true" className="font-display text-[22px] font-extrabold text-deep tabular-nums">
        {formatPrice(price)}
      </span>
      <span
        aria-hidden="true"
        className="grid size-10 place-items-center rounded-full bg-royal text-white transition-colors group-hover:bg-deep"
      >
        <Plus className="size-[18px]" strokeWidth={2.75} />
      </span>
    </button>
  );
}
