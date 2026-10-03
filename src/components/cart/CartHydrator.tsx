"use client";

import { useEffect } from "react";
import { CART_STORAGE_KEY, useCartStore } from "@/features/cart/store";
import { useLiveStore } from "@/features/live/store";

/**
 * Relit le panier enregistré après le premier rendu (synchronisé entre onglets)
 * et tient à jour les réglages en direct (pause, délai, ruptures).
 */
export function CartHydrator() {
  useEffect(() => {
    void useCartStore.persist.rehydrate();
    const refreshLive = useLiveStore.getState().refresh;
    void refreshLive();
    const timer = window.setInterval(refreshLive, 60_000);
    const onStorage = (e: StorageEvent) => {
      if (e.key === CART_STORAGE_KEY) void useCartStore.persist.rehydrate();
    };
    const onVisible = () => document.visibilityState === "visible" && void refreshLive();
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
  return null;
}
