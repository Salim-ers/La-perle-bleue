"use client";

import { useEffect } from "react";
import { useCartStore } from "@/features/cart/store";

/** Vide le panier une fois le paiement confirmé par le serveur (monté uniquement dans ce cas). */
export function ClearCartOnPaid() {
  const hydrated = useCartStore((s) => s.hydrated);
  const clearCart = useCartStore((s) => s.clearCart);
  useEffect(() => {
    if (hydrated) clearCart();
  }, [hydrated, clearCart]);
  return null;
}
