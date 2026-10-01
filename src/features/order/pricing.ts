import type { Cents, OptionGroup, Product, Selection } from "./types";

/** Limites effectives d'un groupe, compte tenu des autres choix (ex. tacos 2 viandes -> 2). */
export function getGroupLimits(group: OptionGroup, selection: Selection) {
  if (group.limitsFrom) {
    const picked = selection[group.limitsFrom.groupId]?.[0];
    const limits = picked ? group.limitsFrom.byOption[picked] : undefined;
    if (limits) return limits;
  }
  return { min: group.min, max: group.max };
}

export function getDefaultSelection(product: Product): Selection {
  return Object.fromEntries(
    product.optionGroups.map((g) => [
      g.id,
      g.options.filter((o) => o.default && o.available !== false).map((o) => o.id),
    ]),
  );
}

/**
 * LA fonction de prix du site. Configurateur, panier, récapitulatif et
 * /api/checkout l'utilisent tous : aucun autre calcul de prix n'existe.
 *
 *   prix unitaire = basePrice + somme des priceDelta des options choisies
 *   total         = prix unitaire × quantité
 *
 * Les options inconnues sont ignorées ici ; validateSelection() les refuse.
 */
export function calculateItemPrice(
  product: Product,
  selection: Selection,
  quantity = 1,
): { unitPrice: Cents; total: Cents } {
  let unitPrice = product.basePrice;
  for (const group of product.optionGroups) {
    for (const id of selection[group.id] ?? []) {
      unitPrice += group.options.find((o) => o.id === id)?.priceDelta ?? 0;
    }
  }
  return { unitPrice, total: unitPrice * quantity };
}

/** Résumé lisible d'un choix : ["Galette", "Sans oignons", "Sauces : Blanche, Harissa"]. */
export function describeSelection(product: Product, selection: Selection): string[] {
  const lines: string[] = [];
  for (const g of product.optionGroups) {
    const ids = selection[g.id] ?? [];
    const mode = g.summary ?? "always";
    if (mode === "removed") {
      const removed = g.options.filter((o) => o.default && !ids.includes(o.id));
      if (removed.length) lines.push(`Sans ${removed.map((o) => o.name.toLowerCase()).join(", ")}`);
      continue;
    }
    const chosen = g.options.filter((o) => ids.includes(o.id));
    if (!chosen.length) continue;
    if (mode === "changes") {
      const changed = chosen.filter((o) => !o.default);
      if (changed.length) lines.push(changed.map((o) => o.name).join(", "));
      continue;
    }
    lines.push(`${g.name} : ${chosen.map((o) => o.name).join(", ")}`);
  }
  return lines;
}

/** Clé stable d'un choix, pour regrouper deux lignes identiques du panier. */
export function selectionKey(selection: Selection) {
  return Object.keys(selection)
    .sort()
    .map((k) => `${k}=${[...selection[k]].sort().join(",")}`)
    .join("|");
}

/** Aide affichée sous le titre d'un groupe : « Choisissez 2 viandes », « Jusqu'à 2 sauces »… */
export function groupHint(group: OptionGroup, selection: Selection) {
  if (group.hint) return group.hint;
  const { min, max } = getGroupLimits(group, selection);
  const [one, many] = group.unit ?? ["choix", "choix"];
  const unit = (n: number) => (n > 1 ? many : one);
  if (min > 0 && min === max) return max === 1 && !group.unit ? "1 choix" : `Choisissez ${max} ${unit(max)}`;
  if (min > 0) return `De ${min} à ${max} ${unit(max)}`;
  return max === 1 ? "" : `Jusqu'à ${max} ${unit(max)}`;
}

/** Choix unique obligatoire : boutons radio. Sinon : cases à cocher. */
export const isSingleChoice = (group: OptionGroup) => group.required && group.max === 1 && !group.limitsFrom;
