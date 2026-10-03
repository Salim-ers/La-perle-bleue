/**
 * Restaurant, réglages (pause, délai, créneaux, horaires) et ruptures.
 * Le restaurant et ses réglages sont créés automatiquement au premier accès
 * (valeurs initiales : src/data/restaurant.ts et src/data/ordering.ts).
 */
import "server-only";
import { and, eq, gte, lt, ne, or, sql } from "drizzle-orm";
import { orderingSettings } from "@/data/ordering";
import { restaurant as restaurantData } from "@/data/restaurant";
import { computePickupAvailability, type PickupAvailability } from "@/features/order/pickup";
import type { LiveSettings } from "@/features/order/types";
import { parisNow } from "@/lib/hours";
import { getDb, isDatabaseConfigured } from "./db";
import { orders, productAvailability, restaurantSettings, restaurants } from "./db/schema";
import { getPaymentProvider } from "./payments";
import { parisDayBounds } from "./time";

const SLUG = "la-perle-bleue";
const cache = globalThis as unknown as { __lpbRestaurantId?: string };

export async function getRestaurantId(): Promise<string> {
  if (cache.__lpbRestaurantId) return cache.__lpbRestaurantId;
  const db = await getDb();
  await db.insert(restaurants).values({ slug: SLUG, name: restaurantData.name }).onConflictDoNothing();
  const [row] = await db.select({ id: restaurants.id }).from(restaurants).where(eq(restaurants.slug, SLUG));
  await db
    .insert(restaurantSettings)
    .values({
      restaurantId: row.id,
      preparationDelay: orderingSettings.defaultPreparationDelay,
      maxOrdersPerSlot: orderingSettings.defaultMaxOrdersPerSlot,
      openingHours: restaurantData.openingHours,
    })
    .onConflictDoNothing();
  cache.__lpbRestaurantId = row.id;
  return row.id;
}

export async function getSettings() {
  const db = await getDb();
  const id = await getRestaurantId();
  const [row] = await db.select().from(restaurantSettings).where(eq(restaurantSettings.restaurantId, id));
  return row;
}

export async function updateSettings(patch: Partial<{ ordersEnabled: boolean; preparationDelay: number; maxOrdersPerSlot: number }>) {
  const db = await getDb();
  const id = await getRestaurantId();
  const [row] = await db
    .update(restaurantSettings)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(restaurantSettings.restaurantId, id))
    .returning();
  return row;
}

export async function getAvailability() {
  const db = await getDb();
  const id = await getRestaurantId();
  const rows = await db
    .select()
    .from(productAvailability)
    .where(and(eq(productAvailability.restaurantId, id), eq(productAvailability.available, false)));
  return {
    unavailableProducts: rows.filter((r) => r.itemType === "product").map((r) => r.itemId),
    unavailableOptions: rows.filter((r) => r.itemType === "option").map((r) => r.itemId),
  };
}

export async function setAvailability(itemType: "product" | "option", itemId: string, available: boolean) {
  const db = await getDb();
  const restaurantId = await getRestaurantId();
  await db
    .insert(productAvailability)
    .values({ restaurantId, itemType, itemId, available })
    .onConflictDoUpdate({
      target: [productAvailability.restaurantId, productAvailability.itemType, productAvailability.itemId],
      set: { available, updatedAt: new Date() },
    });
}

export type LiveState = LiveSettings & { reason?: "paused" | "setup" };

/** Réglages publics en direct. Commandes fermées si base ou paiement non configurés. */
export async function getLiveSettings(): Promise<LiveState> {
  const closed = (reason: "paused" | "setup", delay = orderingSettings.defaultPreparationDelay): LiveState => ({
    ordersEnabled: false,
    reason,
    preparationDelay: delay,
    unavailableProducts: [],
    unavailableOptions: [],
  });
  if (!isDatabaseConfigured() || !getPaymentProvider().ok) return closed("setup");
  const [settings, availability] = await Promise.all([getSettings(), getAvailability()]);
  return {
    ordersEnabled: settings.ordersEnabled,
    reason: settings.ordersEnabled ? undefined : "paused",
    preparationDelay: settings.preparationDelay,
    ...availability,
  };
}

/** Commandes déjà prises aujourd'hui par créneau (les paiements abandonnés ne comptent plus après 15 min). */
export async function getSlotCounts(): Promise<Record<string, number>> {
  const db = await getDb();
  const restaurantId = await getRestaurantId();
  const { start, end } = parisDayBounds();
  const rows = await db
    .select({ slot: orders.pickupSlot, count: sql<number>`count(*)::int` })
    .from(orders)
    .where(
      and(
        eq(orders.restaurantId, restaurantId),
        gte(orders.pickupTime, start),
        lt(orders.pickupTime, end),
        ne(orders.status, "CANCELLED"),
        or(ne(orders.status, "PENDING_PAYMENT"), gte(orders.createdAt, new Date(Date.now() - 15 * 60_000))),
      ),
    )
    .groupBy(orders.pickupSlot);
  return Object.fromEntries(rows.map((r) => [r.slot, Number(r.count)]));
}

export async function getPickupAvailability(): Promise<PickupAvailability> {
  const [settings, slotCounts] = await Promise.all([getSettings(), getSlotCounts()]);
  return computePickupAvailability({
    now: parisNow(),
    hours: settings.openingHours,
    ordersEnabled: settings.ordersEnabled,
    preparationDelay: settings.preparationDelay,
    maxOrdersPerSlot: settings.maxOrdersPerSlot,
    slotCounts,
  });
}

