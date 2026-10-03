import { formatEuros } from "@/lib/money";
import type { OptionGroup, PriceBreakdown, Product, Selection } from "./types";

/** Limites effectives d'un groupe, compte tenu des autres choix (ex. tacos 2 viandes -> 2). */
export function getGroupLimits(group: OptionGroup, selection: Selection) {
  if (group.limitsFrom) {
    const picked = selection[group.limitsFrom.groupId]?.[0];
    const limits = picked ? group.limitsFrom.byOption[picked] : undefined;
    if (limits) return limits;
  }
  return { min: group.min, max: group.max };
}

/** Un groupe est-il proposé, compte tenu des autres choix (ex. boisson seulement en menu) ? */
export function isGroupVisible(group: OptionGroup, selection: Selection) {
  const has = (c: { groupId: string; optionIds: string[] }) =>
    (selection[c.groupId] ?? []).some((id) => c.optionIds.includes(id));
  if (group.visibleIf && !has(group.visibleIf)) return false;
  if (group.hiddenIf && has(group.hiddenIf)) return false;
  return true;
}

export const visibleGroups = (product: Product, selection: Selection) =>
  product.optionGroups.filter((g) => isGroupVisible(g, selection));

/** Choix par défaut (options cochées par défaut et disponibles), groupes masqués vidés. */
export function getDefaultSelection(product: Product): Selection {
  const selection: Selection = Object.fromEntries(
    product.optionGroups.map((g) => [g.id, g.options.filter((o) => o.default && o.available !== false).map((o) => o.id)]),
  );
  return normalizeSelection(product, selection);
}

/**
 * Remet un choix en cohérence après une modification : groupes masqués vidés,
 * groupes dépendants ramenés à leur maximum (ex. tacos 3 -> 1 viande).
 */
export function normalizeSelection(product: Product, selection: Selection): Selection {
  const next: Selection = { ...selection };
  for (const g of product.optionGroups) {
    if (!isGroupVisible(g, next)) next[g.id] = [];
    else if (g.limitsFrom) next[g.id] = (next[g.id] ?? []).slice(0, getGroupLimits(g, next).max);
  }
  return next;
}

/**
 * LA fonction de prix du site. Configurateur, panier, récapitulatif, cuisine
 * et /api/checkout l'utilisent tous : aucun autre calcul de prix n'existe.
 *
 *   options   = somme des priceDelta des options choisies (groupes visibles)
 *             + choix au-delà des inclus × extraPriceDelta (ex. 3e sauce)
 *   unitaire  = basePrice + options
 *   total     = unitaire × quantité
 *
 * Les options inconnues sont ignorées ici ; validateSelection() les refuse.
 */
export function calculateConfiguredProductPrice(product: Product, selection: Selection, quantity = 1): PriceBreakdown {
  let optionsPrice = 0;
  for (const group of visibleGroups(product, selection)) {
    const ids = selection[group.id] ?? [];
    for (const id of ids) optionsPrice += group.options.find((o) => o.id === id)?.priceDelta ?? 0;
    if (group.included !== undefined && group.extraPriceDelta) {
      optionsPrice += Math.max(0, ids.length - group.included) * group.extraPriceDelta;
    }
  }
  const unitPrice = product.basePrice + optionsPrice;
  return { basePrice: product.basePrice, optionsPrice, unitPrice, total: unitPrice * quantity };
}

const chosen = (g: OptionGroup, selection: Selection) => g.options.filter((o) => (selection[g.id] ?? []).includes(o.id));
const removed = (g: OptionGroup, selection: Selection) =>
  g.options.filter((o) => o.default && !(selection[g.id] ?? []).includes(o.id));

/** Résumé client (panier, e-mails) : « Galette », « Sans oignons », « Sauces : Blanche, Harissa »… */
export function describeSelection(product: Product, selection: Selection): string[] {
  const lines: string[] = [];
  for (const g of visibleGroups(product, selection)) {
    const mode = g.summary ?? "always";
    if (mode === "removed") {
      const out = removed(g, selection);
      if (out.length) lines.push(`Sans ${out.map((o) => o.name.toLowerCase()).join(", ")}`);
      continue;
    }
    const picked = chosen(g, selection);
    if (!picked.length) continue;
    if (mode === "changes") {
      const changed = picked.filter((o) => !o.default);
      if (changed.length) lines.push(changed.map((o) => o.name).join(", "));
      continue;
    }
    lines.push(`${g.name} : ${picked.map((o) => o.name).join(", ")}`);
  }
  return lines;
}

/** Détail cuisine : TOUS les choix, y compris ceux par défaut et les retraits. Rien n'est masqué. */
export function describeForKitchen(product: Product, selection: Selection): string[] {
  const lines: string[] = [];
  for (const g of visibleGroups(product, selection)) {
    const picked = chosen(g, selection).map((o) => o.name);
    if (g.summary === "removed") {
      const out = removed(g, selection).map((o) => o.name);
      const parts = [picked.length ? picked.join(", ") : "aucune", ...(out.length ? [`SANS ${out.join(", ").toUpperCase()}`] : [])];
      lines.push(`${g.name} : ${parts.join(" — ")}`);
      continue;
    }
    if (picked.length) lines.push(`${g.name} : ${picked.join(", ")}`);
  }
  return lines;
}

/** Clé stable d'un choix : deux lignes de panier identiques sont regroupées. */
export function selectionKey(selection: Selection) {
  return Object.keys(selection)
    .filter((k) => selection[k].length)
    .sort()
    .map((k) => `${k}=${[...selection[k]].sort().join(",")}`)
    .join("|");
}

/** Aide sous le titre d'un groupe : « Choisissez 2 viandes », « 2 incluses, +0,50 € la suivante »… */
export function groupHint(group: OptionGroup, selection: Selection) {
  if (group.hint) return group.hint;
  const { min, max } = getGroupLimits(group, selection);
  const [one, many] = group.unit ?? ["choix", "choix"];
  const unit = (n: number) => (n > 1 ? many : one);
  if (group.included !== undefined && group.extraPriceDelta) {
    return `${group.included} ${unit(group.included)} incluse${group.included > 1 ? "s" : ""}, ${formatEuros(group.extraPriceDelta)} la suivante (${max} max.)`;
  }
  if (min > 0 && min === max) return max === 1 && !group.unit ? "1 choix" : `Choisissez ${max} ${unit(max)}`;
  if (min > 0) return `De ${min} à ${max} ${unit(max)}`;
  return max === 1 ? "" : `Jusqu'à ${max} ${unit(max)}`;
}

/** Choix unique obligatoire : boutons radio. Sinon : cases à cocher. */
export const isSingleChoice = (group: OptionGroup) => group.required && group.max === 1 && !group.limitsFrom;
