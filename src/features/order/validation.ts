/**
 * Validation partagée navigateur / serveur. Le serveur ne fait jamais
 * confiance au navigateur : il rejoue ces contrôles sur chaque commande.
 */
import { orderingSettings } from "@/data/ordering";
import { getGroupLimits } from "./pricing";
import type { CheckoutRequest, CheckoutRequestItem, Customer, PickupTime, Product, Selection } from "./types";

export type SelectionErrors = Record<string, string>;

export function validateSelection(product: Product, selection: Selection): SelectionErrors {
  const errors: SelectionErrors = {};
  for (const key of Object.keys(selection)) {
    if (!product.optionGroups.some((g) => g.id === key)) errors[key] = "Option inconnue.";
  }
  for (const group of product.optionGroups) {
    const ids = selection[group.id] ?? [];
    const { min, max } = getGroupLimits(group, selection);
    const need = group.required ? Math.max(1, min) : min;
    const [one, many] = group.unit ?? ["option", "options"];
    if (new Set(ids).size !== ids.length) {
      errors[group.id] = "Option en double.";
    } else if (ids.some((id) => group.options.find((o) => o.id === id)?.available === false)) {
      errors[group.id] = "Une option choisie n'est plus disponible.";
    } else if (ids.some((id) => !group.options.some((o) => o.id === id))) {
      errors[group.id] = "Option inconnue.";
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

// ——— Client ———

const PHONE_FR = /^(?:\+33|0033|0)[1-9]\d{8}$/;
const PHONE_INTL = /^\+[1-9]\d{7,14}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const normalizePhone = (value: string) => value.replace(/[\s.\-()]/g, "");

export function validateCustomer(c: Partial<Customer>): Partial<Record<keyof Customer, string>> {
  const errors: Partial<Record<keyof Customer, string>> = {};
  const firstName = c.firstName?.trim() ?? "";
  const phone = normalizePhone(c.phone ?? "");
  const email = c.email?.trim() ?? "";
  if (!firstName) errors.firstName = "Indiquez votre prénom.";
  else if (firstName.length > 50) errors.firstName = "50 caractères maximum.";
  if (!phone) errors.phone = "Indiquez votre numéro de téléphone.";
  else if (!PHONE_FR.test(phone) && !PHONE_INTL.test(phone))
    errors.phone = "Numéro invalide. Exemple : 06 12 34 56 78.";
  if (!email) errors.email = "Indiquez votre e-mail.";
  else if (email.length > 254 || !EMAIL.test(email)) errors.email = "Adresse e-mail invalide.";
  return errors;
}

// ——— Requête de paiement (format uniquement ; les prix sont recalculés à part) ———

type Parsed<T> = { ok: true; value: T } | { ok: false; message: string };

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const isShortString = (v: unknown, max: number): v is string => typeof v === "string" && v.length <= max;
const optionalText = (v: unknown, max: number) =>
  v === undefined || v === null || v === "" ? undefined : isShortString(v, max) ? v.trim() : null;

function parseItem(raw: unknown): CheckoutRequestItem | null {
  if (!isRecord(raw)) return null;
  const { productId, options, quantity, note } = raw;
  if (!isShortString(productId, 64) || !productId) return null;
  if (!Number.isInteger(quantity) || (quantity as number) < 1 || (quantity as number) > orderingSettings.maxQuantityPerItem)
    return null;
  if (!isRecord(options) || Object.keys(options).length > 20) return null;
  const selection: Selection = {};
  for (const [groupId, ids] of Object.entries(options)) {
    if (!isShortString(groupId, 64) || !Array.isArray(ids) || ids.length > 20) return null;
    if (!ids.every((id) => isShortString(id, 64))) return null;
    selection[groupId] = ids as string[];
  }
  const cleanNote = optionalText(note, 140);
  if (cleanNote === null) return null;
  return { productId, options: selection, quantity: quantity as number, note: cleanNote };
}

function parsePickup(raw: unknown): PickupTime | null {
  if (!isRecord(raw)) return null;
  if (raw.type === "ASAP") return { type: "ASAP" };
  if (raw.type === "SCHEDULED" && typeof raw.time === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(raw.time))
    return { type: "SCHEDULED", time: raw.time };
  return null;
}

export function parseCheckoutRequest(body: unknown): Parsed<CheckoutRequest> {
  if (!isRecord(body)) return { ok: false, message: "Requête invalide." };
  const { items, customer, pickup, fulfillment, note } = body;
  if (!Array.isArray(items) || items.length === 0) return { ok: false, message: "Le panier est vide." };
  if (items.length > orderingSettings.maxItemsPerOrder) return { ok: false, message: "Trop d'articles dans le panier." };
  const parsedItems = items.map(parseItem);
  if (parsedItems.some((i) => i === null)) return { ok: false, message: "Article invalide dans le panier." };
  if (!isRecord(customer)) return { ok: false, message: "Coordonnées manquantes." };
  const parsedPickup = parsePickup(pickup);
  if (!parsedPickup) return { ok: false, message: "Heure de retrait invalide." };
  if (fulfillment !== "PICKUP" && fulfillment !== "DELIVERY") return { ok: false, message: "Mode de retrait invalide." };
  const cleanNote = optionalText(note, 300);
  if (cleanNote === null) return { ok: false, message: "Note trop longue." };
  return {
    ok: true,
    value: {
      items: parsedItems as CheckoutRequestItem[],
      // Champs trop longs ou absents -> "", puis refusés par validateCustomer().
      customer: {
        firstName: isShortString(customer.firstName, 100) ? customer.firstName.trim() : "",
        phone: isShortString(customer.phone, 40) ? normalizePhone(customer.phone) : "",
        email: isShortString(customer.email, 254) ? customer.email.trim().toLowerCase() : "",
      },
      pickup: parsedPickup,
      fulfillment,
      note: cleanNote,
    },
  };
}
