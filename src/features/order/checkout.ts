/**
 * Calcul serveur d'une commande. Le navigateur n'envoie que des identifiants :
 * produits et options sont relus dans le catalogue, puis les prix recalculés
 * avec calculateItemPrice(). Le montant payé ne vient jamais du navigateur.
 */
import { getProduct } from "./catalog";
import { calculateItemPrice } from "./pricing";
import type { Cents, CheckoutRequestItem, OrderItem } from "./types";
import { validateSelection } from "./validation";

export type PricedOrder =
  | { ok: true; items: OrderItem[]; subtotal: Cents; total: Cents }
  | { ok: false; message: string };

export function priceOrder(items: CheckoutRequestItem[]): PricedOrder {
  const lines: OrderItem[] = [];
  for (const [index, item] of items.entries()) {
    const product = getProduct(item.productId);
    if (!product || !product.available) {
      return { ok: false, message: `${product?.name ?? "Un article"} n'est plus disponible. Retirez-le du panier.` };
    }
    if (Object.keys(validateSelection(product, item.options)).length > 0) {
      return { ok: false, message: `Les options de « ${product.name} » ne sont plus valides. Modifiez cet article.` };
    }
    const { unitPrice, total } = calculateItemPrice(product, item.options, item.quantity);
    lines.push({
      id: `line-${index + 1}`,
      productId: product.id,
      productName: product.name,
      options: product.optionGroups.flatMap((g) =>
        (item.options[g.id] ?? []).map((id) => {
          const o = g.options.find((x) => x.id === id)!;
          return { groupId: g.id, groupName: g.name, optionId: o.id, optionName: o.name, priceDelta: o.priceDelta };
        }),
      ),
      quantity: item.quantity,
      unitPrice,
      totalPrice: total,
      note: item.note,
    });
  }
  const subtotal = lines.reduce((sum, l) => sum + l.totalPrice, 0);
  // Pas de frais ni de remise en V1 : total = sous-total.
  return { ok: true, items: lines, subtotal, total: subtotal };
}
