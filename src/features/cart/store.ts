/**
 * Panier (Zustand), persistant dans le localStorage.
 *
 * Le panier ne stocke que des identifiants (produit, options) et des
 * quantités. Les prix sont toujours recalculés depuis le catalogue avec
 * calculateItemPrice() : un prix modifié sur la carte s'applique aussi aux
 * paniers déjà enregistrés, et rien de ce qui est stocké ici n'est payé tel quel.
 */
import { useMemo } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { orderingSettings } from "@/data/ordering";
import { getProduct } from "@/features/order/catalog";
import { calculateItemPrice, describeSelection, selectionKey } from "@/features/order/pricing";
import type { Cents, Product, Selection } from "@/features/order/types";
import { validateSelection } from "@/features/order/validation";

export interface CartItem {
  lineId: string;
  productId: string;
  options: Selection;
  quantity: number;
  note?: string;
}

export type NewCartItem = Omit<CartItem, "lineId">;

interface CartState {
  items: CartItem[];
  updatedAt: number | null;
  /** Vrai une fois le panier relu depuis le navigateur. */
  hydrated: boolean;
  addItem: (item: NewCartItem) => void;
  removeItem: (lineId: string) => void;
  /** Quantité < 1 : la ligne est supprimée. */
  updateQuantity: (lineId: string, quantity: number) => void;
  clearCart: () => void;
}

export const CART_STORAGE_KEY = "la-perle-bleue:panier";
const MAX_AGE_MS = orderingSettings.cartMaxAgeHours * 60 * 60 * 1000;

const clampQuantity = (q: number) =>
  Math.min(orderingSettings.maxQuantityPerItem, Math.max(1, Math.round(q)));

const newLineId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const isSameLine = (a: NewCartItem, b: NewCartItem) =>
  a.productId === b.productId &&
  (a.note ?? "") === (b.note ?? "") &&
  selectionKey(a.options) === selectionKey(b.options);

/** Écarte les lignes devenues invalides (produit retiré, en rupture, options modifiées). */
function sanitize(items: unknown): CartItem[] {
  if (!Array.isArray(items)) return [];
  return items
    .filter((i): i is CartItem => {
      if (!i || typeof i !== "object" || typeof i.productId !== "string") return false;
      const product = getProduct(i.productId);
      return (
        !!product &&
        product.available &&
        Number.isInteger(i.quantity) &&
        i.quantity >= 1 &&
        typeof i.options === "object" &&
        Object.keys(validateSelection(product, i.options ?? {})).length === 0
      );
    })
    .map((i) => ({ ...i, quantity: clampQuantity(i.quantity) }));
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      updatedAt: null,
      hydrated: false,
      addItem: (item) =>
        set((s) => {
          const existing = s.items.find((i) => isSameLine(i, item));
          const items = existing
            ? s.items.map((i) =>
                i === existing ? { ...i, quantity: clampQuantity(i.quantity + item.quantity) } : i,
              )
            : [...s.items, { ...item, quantity: clampQuantity(item.quantity), lineId: newLineId() }];
          return { items, updatedAt: Date.now() };
        }),
      removeItem: (lineId) =>
        set((s) => ({ items: s.items.filter((i) => i.lineId !== lineId), updatedAt: Date.now() })),
      updateQuantity: (lineId, quantity) =>
        set((s) => ({
          items:
            quantity < 1
              ? s.items.filter((i) => i.lineId !== lineId)
              : s.items.map((i) => (i.lineId === lineId ? { ...i, quantity: clampQuantity(quantity) } : i)),
          updatedAt: Date.now(),
        })),
      clearCart: () => set({ items: [], updatedAt: Date.now() }),
    }),
    {
      name: CART_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // Relu par <CartHydrator /> après le premier rendu : le HTML serveur et le
      // premier rendu navigateur affichent tous deux un panier vide.
      skipHydration: true,
      partialize: (s) => ({ items: s.items, updatedAt: s.updatedAt }),
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<CartState>;
        const expired = !saved.updatedAt || Date.now() - saved.updatedAt > MAX_AGE_MS;
        return {
          ...current,
          items: expired ? [] : sanitize(saved.items),
          updatedAt: expired ? null : (saved.updatedAt ?? null),
          hydrated: true,
        };
      },
    },
  ),
);

// ——— Valeurs dérivées ———

export interface CartLine extends CartItem {
  product: Product;
  unitPrice: Cents;
  total: Cents;
  summary: string[];
}

export function toCartLines(items: CartItem[]): CartLine[] {
  return items.flatMap((item) => {
    const product = getProduct(item.productId);
    if (!product) return [];
    const { unitPrice, total } = calculateItemPrice(product, item.options, item.quantity);
    return [{ ...item, product, unitPrice, total, summary: describeSelection(product, item.options) }];
  });
}

const subtotalOf = (items: CartItem[]) => toCartLines(items).reduce((sum, l) => sum + l.total, 0);

export function useCartLines() {
  const items = useCartStore((s) => s.items);
  return useMemo(() => toCartLines(items), [items]);
}

export const useCartCount = () => useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0));

export const useCartSubtotal = () => useCartStore((s) => subtotalOf(s.items));
