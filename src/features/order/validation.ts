/**
 * Validation partagée navigateur / serveur. Le serveur ne fait jamais
 * confiance au navigateur : il rejoue ces contrôles sur chaque commande.
 */
import { getGroupLimits, isGroupVisible } from "./pricing";
import type { Customer, Product, Selection } from "./types";

export const NOTE_MAX = 150;
export const ORDER_NOTE_MAX = 300;

export type SelectionErrors = Record<string, string>;

export function validateSelection(product: Product, selection: Selection): SelectionErrors {
  const errors: SelectionErrors = {};
  for (const key of Object.keys(selection)) {
    if (!product.optionGroups.some((g) => g.id === key)) errors[key] = "Option inconnue.";
  }
  for (const group of product.optionGroups) {
    const ids = selection[group.id] ?? [];
    if (!isGroupVisible(group, selection)) {
      if (ids.length) errors[group.id] = "Option non proposée avec ce choix.";
      continue;
    }
    const { min, max } = getGroupLimits(group, selection);
    const need = group.required ? Math.max(1, min) : min;
    const [one, many] = group.unit ?? ["option", "options"];
    if (new Set(ids).size !== ids.length) {
      errors[group.id] = "Option en double.";
    } else if (ids.some((id) => !group.options.some((o) => o.id === id))) {
      errors[group.id] = "Option inconnue.";
    } else if (ids.some((id) => group.options.find((o) => o.id === id)?.available === false)) {
      errors[group.id] = "Une option choisie n'est plus disponible.";
    } else if (ids.length < need) {
      errors[group.id] =
        need === max
          ? need === 1
            ? "Faites un choix pour continuer."
            : `Choisissez ${need} ${many}.`
          : `Choisissez au moins ${need} ${need > 1 ? many : one}.`;
    } else if (ids.length > max) {
      errors[group.id] = `${max} choix maximum.`;
    }
  }
  return errors;
}

// ——— Coordonnées ———

const PHONE_FR = /^(?:\+33|0033|0)[1-9]\d{8}$/;
const PHONE_INTL = /^\+[1-9]\d{7,14}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const normalizePhone = (value: string) => value.replace(/[\s.\-()]/g, "");

export function validateCustomer(c: Partial<Customer>): Partial<Record<keyof Customer, string>> {
  const errors: Partial<Record<keyof Customer, string>> = {};
  const firstName = c.firstName?.trim() ?? "";
  const lastName = c.lastName?.trim() ?? "";
  const phone = normalizePhone(c.phone ?? "");
  const email = c.email?.trim() ?? "";
  if (!firstName) errors.firstName = "Indiquez votre prénom.";
  else if (firstName.length > 50) errors.firstName = "50 caractères maximum.";
  if (!lastName) errors.lastName = "Indiquez votre nom.";
  else if (lastName.length > 80) errors.lastName = "80 caractères maximum.";
  if (!phone) errors.phone = "Indiquez votre numéro de téléphone.";
  else if (!PHONE_FR.test(phone) && !PHONE_INTL.test(phone)) errors.phone = "Numéro invalide. Exemple : 06 12 34 56 78.";
  if (!email) errors.email = "Indiquez votre e-mail.";
  else if (email.length > 254 || !EMAIL.test(email)) errors.email = "Adresse e-mail invalide.";
  return errors;
}
