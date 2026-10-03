/** État d'interface de la commande (non persistant) : configurateur, tiroir panier, notification. */
import { create } from "zustand";
import { getLive, PAUSED_MESSAGE, SETUP_MESSAGE } from "@/features/live/store";
import { getProduct, withAvailability } from "@/features/order/catalog";
import { useCartStore } from "./store";

interface OrderUIState {
  configuratorProductId: string | null;
  /** Ligne du panier en cours de modification (bouton MODIFIER). */
  editingLineId: string | null;
  cartOpen: boolean;
  toast: { id: number; message: string } | null;
  openConfigurator: (productId: string, editingLineId?: string) => void;
  closeConfigurator: () => void;
  openCart: () => void;
  closeCart: () => void;
  notify: (message: string) => void;
  dismissToast: () => void;
}

export const useOrderUI = create<OrderUIState>()((set) => ({
  configuratorProductId: null,
  editingLineId: null,
  cartOpen: false,
  toast: null,
  openConfigurator: (productId, editingLineId) =>
    set({ configuratorProductId: productId, editingLineId: editingLineId ?? null, cartOpen: false }),
  closeConfigurator: () => set({ configuratorProductId: null, editingLineId: null }),
  openCart: () => set({ cartOpen: true, configuratorProductId: null, editingLineId: null, toast: null }),
  closeCart: () => set({ cartOpen: false }),
  notify: (message) => set({ toast: { id: Date.now(), message } }),
  dismissToast: () => set({ toast: null }),
}));

/**
 * Point d'entrée de tous les boutons « Ajouter » / « + ».
 * Commandes suspendues ou produit en rupture : message. Produit sans option : ajout direct.
 */
export function startOrder(productId: string) {
  const live = getLive();
  const ui = useOrderUI.getState();
  if (live && !live.ordersEnabled) {
    ui.notify(live.reason === "setup" ? SETUP_MESSAGE : PAUSED_MESSAGE);
    return;
  }
  const base = getProduct(productId);
  if (!base) return;
  const product = withAvailability(base, live);
  if (!product.available) {
    ui.notify(`${product.name} : momentanément indisponible`);
    return;
  }
  if (product.optionGroups.length === 0) {
    useCartStore.getState().addItem({ productId, options: {}, quantity: 1 });
    ui.notify(`Ajouté au panier : ${product.name}`);
    return;
  }
  ui.openConfigurator(productId);
}

/** Bouton MODIFIER du panier : rouvre le configurateur avec la configuration actuelle. */
export function editCartLine(lineId: string) {
  const line = useCartStore.getState().items.find((i) => i.lineId === lineId);
  if (line) useOrderUI.getState().openConfigurator(line.productId, lineId);
}
