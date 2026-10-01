"use client";

import { useEffect } from "react";
import { CART_STORAGE_KEY, useCartStore } from "@/features/cart/store";

/** Relit le panier enregistré après le premier rendu, et le synchronise entre onglets. */
export function CartHydrator() {
  useEffect(() => {
    void useCartStore.persist.rehydrate();
    const onStorage = (e: StorageEvent) => {
      if (e.key === CART_STORAGE_KEY) void useCartStore.persist.rehydrate();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  return null;
}
