/**
 * GET /api/live — pause des commandes, délai de préparation et ruptures.
 * Mis en cache 5 s par Vercel : un changement dans l'admin est visible en quelques secondes.
 */
import { json } from "@/server/http";
import { getLiveSettings } from "@/server/restaurant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return json(await getLiveSettings(), 200, { "Cache-Control": "public, s-maxage=5, stale-while-revalidate=10" });
  } catch {
    // Base injoignable : on ferme prudemment la commande en ligne, le site reste consultable.
    return json(
      { ordersEnabled: false, reason: "setup", preparationDelay: 20, unavailableProducts: [], unavailableOptions: [] },
      200,
      { "Cache-Control": "no-store" },
    );
  }
}
