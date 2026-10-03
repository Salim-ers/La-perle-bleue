/** GET /api/pickup-slots — « dès que possible » et créneaux du jour (horaires, délai, capacité). */
import { json, serverError } from "@/server/http";
import { getLiveSettings, getPickupAvailability } from "@/server/restaurant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const live = await getLiveSettings();
    if (!live.ordersEnabled) {
      return json({ ordersEnabled: false, asap: { available: false, readyAt: null }, slots: [], preparationDelay: live.preparationDelay });
    }
    return json(await getPickupAvailability());
  } catch (error) {
    return serverError(error);
  }
}
