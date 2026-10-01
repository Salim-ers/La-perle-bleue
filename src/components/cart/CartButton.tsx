"use client";

import { m } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { useCartCount } from "@/features/cart/store";
import { useOrderUI } from "@/features/cart/ui";
import { cn } from "@/lib/utils";

export function CartButton({ className }: { className?: string }) {
  const count = useCartCount();
  const openCart = useOrderUI((s) => s.openCart);
  return (
    <button
      type="button"
      onClick={openCart}
      aria-label={count ? `Voir le panier, ${count} article${count > 1 ? "s" : ""}` : "Voir le panier (vide)"}
      className={cn(
        "relative grid size-11 place-items-center rounded-full text-night transition-colors hover:bg-night/6",
        className,
      )}
    >
      <ShoppingBag className="size-[22px]" strokeWidth={2} aria-hidden="true" />
      {count > 0 && (
        // La clé relance le petit rebond à chaque ajout.
        <m.span
          key={count}
          initial={{ scale: 0.4 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 520, damping: 16 }}
          aria-hidden="true"
          className="absolute top-0.5 right-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-royal px-1 text-[11px] font-bold text-white ring-2 ring-cream tabular-nums"
        >
          {count}
        </m.span>
      )}
    </button>
  );
}
