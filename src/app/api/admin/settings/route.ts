/** GET / PATCH /api/admin/settings — pause des commandes, délai de préparation, commandes par créneau. */
import { settingsUpdateSchema } from "@/features/order/schemas";
import { guardAdmin, json, serverError } from "@/server/http";
import { logEvent } from "@/server/logger";
import { getSettings, updateSettings } from "@/server/restaurant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const view = (s: Awaited<ReturnType<typeof getSettings>>) => ({
  ordersEnabled: s.ordersEnabled,
  preparationDelay: s.preparationDelay,
  maxOrdersPerSlot: s.maxOrdersPerSlot,
});

export async function GET(request: Request) {
  const denied = await guardAdmin(request);
  if (denied) return denied;
  try {
    return json(view(await getSettings()));
  } catch (error) {
    return serverError(error);
  }
}

export async function PATCH(request: Request) {
  const denied = await guardAdmin(request, true);
  if (denied) return denied;
  const parsed = settingsUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: "Réglage invalide." }, 400);
  try {
    const updated = await updateSettings(parsed.data);
    await logEvent("info", "admin.settings", "Réglages modifiés.", { data: parsed.data });
    return json(view(updated));
  } catch (error) {
    return serverError(error);
  }
}
