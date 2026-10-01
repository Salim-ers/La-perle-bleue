/** État d'interface de la commande (non persistant) : configurateur, tiroir panier, notification. */
import { create } from "zustand";
import { getProduct } from "@/features/order/catalog";
import { useCartStore } from "./store";

interface OrderUIState {
  configuratorProductId: string | null;
  cartOpen: boolean;
  toast: { id: number; message: string } | null;
  openConfigurator: (productId: string) => void;
  closeConfigurator: () => void;
  openCart: () => void;
  closeCart: () => void;
  notify: (message: string) => void;
  dismissToast: () => void;
}

export const useOrderUI = create<OrderUIState>()((set) => ({
  configuratorProductId: null,
  cartOpen: false,
  toast: null,
  openConfigurator: (productId) => set({ configuratorProductId: productId, cartOpen: false }),
  closeConfigurator: () => set({ configuratorProductId: null }),
  openCart: () => set({ cartOpen: true, configuratorProductId: null, toast: null }),
  closeCart: () => set({ cartOpen: false }),
  notify: (message) => set({ toast: { id: Date.now(), message } }),
  dismissToast: () => set({ toast: null }),
}));

/**
 * Point d'entrée de tous les boutons « Ajouter » / « + ».
 * Produit sans option (boisson, dessert) : ajout direct. Sinon : configurateur.
 */
export function startOrder(productId: string) {
  const product = getProduct(productId);
  if (!product || !product.available) return;
  if (product.optionGroups.length === 0) {
    useCartStore.getState().addItem({ productId, options: {}, quantity: 1 });
    useOrderUI.getState().notify(`Ajouté au panier : ${product.name}`);
    return;
  }
  useOrderUI.getState().openConfigurator(productId);
}
