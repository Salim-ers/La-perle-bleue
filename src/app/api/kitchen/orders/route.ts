/**
 * GET /api/kitchen/orders — commandes en cours pour l'écran cuisine (interrogé toutes les 3 s).
 * Déclenche aussi, au plus une fois par minute, le rapprochement des paiements en attente.
 */
import { after } from "next/server";
import type { KitchenSnapshot } from "@/features/kitchen/types";
import { guardAdmin, json, serverError } from "@/server/http";
import { listKitchenOrders, reconcilePendingPayments } from "@/server/orders";
import { getSettings } from "@/server/restaurant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = await guardAdmin(request);
  if (denied) return denied;
  try {
    const [orders, settings] = await Promise.all([listKitchenOrders(), getSettings()]);
    after(() => reconcilePendingPayments().catch(() => {}));
    const body: KitchenSnapshot = {
      orders,
      settings: { ordersEnabled: settings.ordersEnabled, preparationDelay: settings.preparationDelay },
      serverTime: new Date().toISOString(),
    };
    return json(body);
  } catch (error) {
    return serverError(error);
  }
}
