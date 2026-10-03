/**
 * Calcul serveur d'une commande. Le navigateur n'envoie que des identifiants :
 * produits et options sont relus dans le catalogue (ruptures appliquées),
 * puis les prix recalculés avec calculateConfiguredProductPrice().
 * Le montant payé ne vient jamais du navigateur.
 */
import { getProduct, withAvailability } from "./catalog";
import { calculateConfiguredProductPrice, describeForKitchen, describeSelection, isGroupVisible } from "./pricing";
import type { Cents, LiveSettings, OrderLine, ProductConfiguration } from "./types";
import { validateSelection } from "./validation";

export type PricedOrder =
  | { ok: true; lines: OrderLine[]; subtotal: Cents; total: Cents }
  | { ok: false; message: string };

export function priceOrder(
  items: ProductConfiguration[],
  live: Pick<LiveSettings, "unavailableProducts" | "unavailableOptions">,
): PricedOrder {
  const lines: OrderLine[] = [];
  for (const item of items) {
    const base = getProduct(item.productId);
    const product = base ? withAvailability(base, live) : null;
    if (!product || !product.available) {
      return { ok: false, message: `${base?.name ?? "Un article"} n'est plus disponible. Retirez-le du panier.` };
    }
    if (Object.keys(validateSelection(product, item.options)).length > 0) {
      return { ok: false, message: `Les options de « ${product.name} » ne sont plus valides. Modifiez cet article.` };
    }
    const { unitPrice, total } = calculateConfiguredProductPrice(product, item.options, item.quantity);
    lines.push({
      productId: product.id,
      productName: product.name,
      quantity: item.quantity,
      unitPrice,
      totalPrice: total,
      note: item.note || undefined,
      summary: describeSelection(product, item.options),
      kitchenLines: describeForKitchen(product, item.options),
      options: product.optionGroups
        .filter((g) => isGroupVisible(g, item.options))
        .flatMap((g) =>
          (item.options[g.id] ?? []).map((optionId) => {
            const o = g.options.find((x) => x.id === optionId)!;
            return { groupId: g.id, groupName: g.name, optionId: o.id, optionName: o.name, priceDelta: o.priceDelta };
          }),
        ),
    });
  }
  const subtotal = lines.reduce((sum, l) => sum + l.totalPrice, 0);
  // Pas de frais ni de remise en V1 : total = sous-total.
  return { ok: true, lines, subtotal, total: subtotal };
}
