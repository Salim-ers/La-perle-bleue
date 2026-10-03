/** GET / PUT /api/admin/availability — ruptures de produits et d'options. */
import { availabilityUpdateSchema } from "@/features/order/schemas";
import { allOptions, getProduct } from "@/features/order/catalog";
import { guardAdmin, json, serverError } from "@/server/http";
import { logEvent } from "@/server/logger";
import { getAvailability, setAvailability } from "@/server/restaurant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = await guardAdmin(request);
  if (denied) return denied;
  try {
    return json(await getAvailability());
  } catch (error) {
    return serverError(error);
  }
}

export async function PUT(request: Request) {
  const denied = await guardAdmin(request, true);
  if (denied) return denied;
  const parsed = availabilityUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: "Demande invalide." }, 400);
  const { type, itemId, available } = parsed.data;
  const known = type === "product" ? !!getProduct(itemId) : allOptions().some((o) => o.id === itemId);
  if (!known) return json({ error: "Élément inconnu." }, 404);
  try {
    await setAvailability(type, itemId, available);
    await logEvent("info", "admin.settings", `${type} « ${itemId} » ${available ? "disponible" : "en rupture"}.`);
    return json(await getAvailability());
  } catch (error) {
    return serverError(error);
  }
}
