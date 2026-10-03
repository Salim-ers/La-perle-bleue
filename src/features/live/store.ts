/**
 * Réglages en direct côté navigateur : pause des commandes, délai de
 * préparation, ruptures. Relus au chargement, toutes les 60 s et au retour
 * sur l'onglet. Le serveur revérifie tout au moment du paiement.
 */
import { create } from "zustand";
import { orderingSettings } from "@/data/ordering";
import { DEMO_PREPARATION_DELAY, isDemoActive } from "@/features/demo/store";
import type { LiveSettings } from "@/features/order/types";

export type Live = LiveSettings & { reason?: "paused" | "setup" };

interface LiveState {
  live: Live | null;
  refresh: () => Promise<void>;
}

export const useLiveStore = create<LiveState>()((set) => ({
  live: null,
  refresh: async () => {
    // Mode démonstration : commandes ouvertes sur cet appareil, sans base ni paiement.
    if (isDemoActive()) {
      set({ live: { ordersEnabled: true, preparationDelay: DEMO_PREPARATION_DELAY, unavailableProducts: [], unavailableOptions: [] } });
      return;
    }
    try {
      const res = await fetch("/api/live", { cache: "no-store" });
      if (res.ok) set({ live: (await res.json()) as Live });
    } catch {
      // Hors ligne : on garde le dernier état connu.
    }
  },
}));

export const PAUSED_MESSAGE = "Commandes temporairement suspendues";
export const SETUP_MESSAGE = "Commande en ligne bientôt disponible";

/** `null` tant que l'état n'est pas connu (on n'affiche alors rien de bloquant). */
export function useOrderingState() {
  const live = useLiveStore((s) => s.live);
  if (!live) return { known: false, canOrder: true, message: null as string | null, preparationDelay: orderingSettings.defaultPreparationDelay };
  return {
    known: true,
    canOrder: live.ordersEnabled,
    message: live.ordersEnabled ? null : live.reason === "setup" ? SETUP_MESSAGE : PAUSED_MESSAGE,
    preparationDelay: live.preparationDelay,
  };
}

export const getLive = () => useLiveStore.getState().live;
