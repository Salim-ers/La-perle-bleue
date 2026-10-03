/**
 * Schémas Zod des API (format des requêtes). Serveur uniquement : Zod n'est
 * pas embarqué dans le JavaScript du site. Prix et options sont recontrôlés
 * à part (validateSelection, priceOrder).
 */
import { z } from "zod";
import { orderingSettings } from "@/data/ordering";
import { NOTE_MAX, ORDER_NOTE_MAX, normalizePhone } from "./validation";

const id = z.string().min(1).max(64).regex(/^[a-z0-9-]+$/);

export const productConfigurationSchema = z.object({
  productId: id,
  options: z.record(id, z.array(id).max(20)).refine((o) => Object.keys(o).length <= 20),
  quantity: z.number().int().min(1).max(orderingSettings.maxQuantityPerItem),
  note: z.string().trim().max(NOTE_MAX).optional(),
});

export const checkoutRequestSchema = z.object({
  attemptId: z.string().uuid(),
  items: z.array(productConfigurationSchema).min(1).max(orderingSettings.maxItemsPerOrder),
  customer: z.object({
    firstName: z.string().trim().max(100),
    lastName: z.string().trim().max(100),
    phone: z.string().max(40).transform(normalizePhone),
    email: z.string().trim().toLowerCase().max(254),
  }),
  pickup: z.discriminatedUnion("type", [
    z.object({ type: z.literal("ASAP") }),
    z.object({ type: z.literal("SCHEDULED"), time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/) }),
  ]),
  fulfillment: z.enum(["PICKUP", "DELIVERY"]),
  note: z.string().trim().max(ORDER_NOTE_MAX).optional(),
});

export const kitchenActionSchema = z.object({
  action: z.enum(["accept", "refuse", "start", "ready", "complete"]),
  reason: z.enum(["rupture", "affluence", "fermeture", "autre"]).optional(),
});

export const settingsUpdateSchema = z
  .object({
    ordersEnabled: z.boolean(),
    preparationDelay: z.number().int().min(5).max(120),
    maxOrdersPerSlot: z.number().int().min(1).max(100),
  })
  .partial();

export const availabilityUpdateSchema = z.object({
  type: z.enum(["product", "option"]),
  itemId: id,
  available: z.boolean(),
});
