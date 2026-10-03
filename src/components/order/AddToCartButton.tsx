"use client";

import { m } from "framer-motion";
import { Plus } from "lucide-react";
import { startOrder } from "@/features/cart/ui";
import { useLiveStore } from "@/features/live/store";
import { cn } from "@/lib/utils";

/** Rupture déclarée dans l'admin (relue en direct). */
export const useProductOutOfStock = (productId: string) =>
  useLiveStore((s) => !!s.live?.unavailableProducts.includes(productId));

/** Bouton « + » des listes de la carte : ouvre le configurateur (ou ajoute directement). */
export function AddToCartButton({
  productId,
  name,
  className,
}: {
  productId: string;
  name: string;
  className?: string;
}) {
  const outOfStock = useProductOutOfStock(productId);
  if (outOfStock) {
    return (
      <span className="shrink-0 rounded-full bg-night/6 px-3 py-2 text-xs font-bold tracking-wide text-slate uppercase">
        Rupture<span className="sr-only"> : {name}</span>
      </span>
    );
  }
  return (
    <m.button
      type="button"
      onClick={() => startOrder(productId)}
      whileTap={{ scale: 0.88 }}
      aria-label={`Ajouter au panier : ${name}`}
      className={cn(
        "grid size-11 shrink-0 place-items-center rounded-full bg-royal text-white shadow-[0_8px_18px_-8px_rgba(1,64,184,0.8)] transition-colors hover:bg-deep",
        className,
      )}
    >
      <Plus className="size-5" strokeWidth={2.5} aria-hidden="true" />
    </m.button>
  );
}
