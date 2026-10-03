"use client";

import { Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { demoPayment, getDemoOrder, type DemoOrder } from "@/features/demo/store";
import { formatEuros } from "@/lib/money";

export function DemoPayment({ id }: { id: string }) {
  const [order, setOrder] = useState<DemoOrder | null | undefined>(undefined);
  useEffect(() => setOrder(getDemoOrder(id)), [id]);

  const pay = (outcome: "authorized" | "failed" | "canceled") => {
    demoPayment(id, outcome);
    window.location.assign(outcome === "canceled" ? "/commande?paiement=annule" : `/demo/suivi/${id}`);
  };

  return (
    <main className="grid min-h-svh place-items-center bg-[#f4f4f6] p-6 font-sans text-[#06132e]">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <p className="text-xs font-bold tracking-widest text-[#b42318] uppercase">Démonstration — aucune carte débitée</p>
        <h1 className="mt-2 flex items-center gap-2 text-2xl font-bold">
          <Lock className="size-5" aria-hidden="true" /> Paiement sécurisé
        </h1>
        {order === null ? (
          <p className="mt-4">Commande de démonstration introuvable.</p>
        ) : (
          <>
            <p className="mt-1 text-[#4a5b7a]">
              La Perle Bleue — commande #{order?.number ?? "…"} : <strong>{order ? formatEuros(order.total) : "…"}</strong>
            </p>
            <p className="mt-3 text-sm text-[#4a5b7a]">
              En réel, c&apos;est ici la page Mollie : la carte est seulement autorisée, puis débitée quand la cuisine accepte.
            </p>
            <div className="mt-6 grid gap-3">
              <button type="button" disabled={!order} onClick={() => pay("authorized")} className="min-h-12 rounded-xl bg-[#0140b8] font-bold text-white">
                Payer (carte autorisée)
              </button>
              <button type="button" disabled={!order} onClick={() => pay("failed")} className="min-h-12 rounded-xl bg-[#fef3f2] font-bold text-[#b42318]">
                Simuler une carte refusée
              </button>
              <button type="button" disabled={!order} onClick={() => pay("canceled")} className="min-h-12 rounded-xl bg-[#eef3fa] font-bold">
                Abandonner le paiement
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
