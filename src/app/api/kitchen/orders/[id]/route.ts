/**
 * POST /api/kitchen/orders/[id] — action cuisine : accept | refuse | start | ready | complete.
 * « accept » déclenche la capture Mollie ; « refuse » libère l'autorisation (ou rembourse).
 */
import { kitchenActionSchema } from "@/features/order/schemas";
import { guardAdmin, json, serverError } from "@/server/http";
import { kitchenAction } from "@/server/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await guardAdmin(request, true);
  if (denied) return denied;
  const { id } = await params;
  if (!UUID.test(id)) return json({ error: "Commande introuvable." }, 404);
  const parsed = kitchenActionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: "Action invalide." }, 400);
  try {
    const result = await kitchenAction(id, parsed.data.action, parsed.data.reason);
    return result.ok ? json({ ok: true, status: result.status }) : json({ error: result.message }, result.httpStatus);
  } catch (error) {
    return serverError(error);
  }
}
