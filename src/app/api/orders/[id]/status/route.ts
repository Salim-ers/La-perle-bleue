/**
 * GET /api/orders/[id]/status — statut public d'une commande (page /suivi).
 * L'identifiant est un UUID aléatoire, impossible à deviner ; aucune donnée
 * sensible n'est renvoyée (prénom seulement).
 */
import { json, serverError } from "@/server/http";
import { getPublicOrder, refreshPendingOrder } from "@/server/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) return json({ error: "Commande introuvable." }, 404);
  try {
    let order = await getPublicOrder(id);
    if (order?.status === "PENDING_PAYMENT") {
      await refreshPendingOrder(id);
      order = await getPublicOrder(id);
    }
    return order ? json(order) : json({ error: "Commande introuvable." }, 404);
  } catch (error) {
    return serverError(error);
  }
}
