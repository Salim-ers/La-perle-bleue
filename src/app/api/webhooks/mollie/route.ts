/**
 * POST /api/webhooks/mollie — notifications de Mollie (corps : id=tr_xxx).
 *
 * Sécurité : le corps ne contient qu'un identifiant ; le statut est TOUJOURS
 * relu chez Mollie avec la clé secrète. Un faux appel ne peut donc rien valider.
 * Idempotence : les transitions sont conditionnelles (voir src/server/orders.ts).
 * Base indisponible -> réponse 500 : Mollie renvoie la notification plus tard.
 */
import { NextResponse } from "next/server";
import { logEvent } from "@/server/logger";
import { syncPayment } from "@/server/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let id: string | null = null;
  try {
    const form = await request.formData();
    id = String(form.get("id") ?? "");
  } catch {
    // corps illisible
  }
  if (!id || !/^[a-z]{2,4}_[A-Za-z0-9]{4,64}$/.test(id)) {
    return new NextResponse("Identifiant manquant", { status: 400 });
  }
  try {
    await syncPayment(id, "webhook");
    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    await logEvent("error", "webhook.error", `Webhook Mollie en erreur (${id}) : ${(error as Error).message}`);
    return new NextResponse("Erreur temporaire", { status: 500 });
  }
}
