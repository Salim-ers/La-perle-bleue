/**
 * Accès aux commandes (serveur uniquement).
 *
 * Phase 2 (Supabase PostgreSQL, voir supabase/schema.sql) :
 * - createOrder()  : insère la commande en PENDING_PAYMENT avec les prix recalculés ;
 * - getOrderById() : lit la commande avec la clé service (jamais exposée au navigateur) ;
 * - markOrderPaid(): appelé UNIQUEMENT par le webhook Stripe signé.
 */
import type { Order } from "./types";

export async function getOrderById(id: string): Promise<Order | null> {
  // TODO(phase 2) : SELECT ... FROM orders WHERE id = $1 (Supabase, côté serveur).
  void id;
  return null;
}
