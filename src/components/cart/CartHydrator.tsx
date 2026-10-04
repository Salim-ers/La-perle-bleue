"use client";

import { useEffect } from "react";
import { CART_STORAGE_KEY, useCartStore } from "@/features/cart/store";
import { useDemo } from "@/features/demo/store";
import { useLiveStore } from "@/features/live/store";

/**
 * Relit le panier enregistré après le premier rendu (synchronisé entre onglets)
 * et tient à jour les réglages en direct (pause, délai, ruptures).
 */
export function CartHydrator() {
  useEffect(() => {
    // Lien de démonstration : ?demo=1 active le mode démo sur cet appareil, ?demo=0 le coupe.
    const demo = new URLSearchParams(window.location.search).get("demo");
    if (demo === "1") useDemo.getState().set(true);
    else if (demo === "0") useDemo.getState().set(false);
    else useDemo.getState().sync();
    void useCartStore.persist.rehydrate();
    const refreshLive = useLiveStore.getState().refresh;
    void refreshLive();
    const timer = window.setInterval(refreshLive, 60_000);
    const onStorage = (e: StorageEvent) => {
      if (e.key === CART_STORAGE_KEY) void useCartStore.persist.rehydrate();
      // Démo : réglages changés dans l'onglet cuisine, appliqués tout de suite.
      if (e.key?.startsWith("lpb-demo")) {
        useDemo.getState().sync();
        void refreshLive();
      }
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
