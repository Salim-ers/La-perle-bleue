"use client";

import { useState } from "react";

const OUTCOMES = [
  { outcome: "authorized", label: "Autoriser la carte", className: "bg-[#0140b8] text-white" },
  { outcome: "failed", label: "Carte refusée", className: "bg-[#fef3f2] text-[#b42318]" },
  { outcome: "canceled", label: "Abandonner le paiement", className: "bg-[#eef3fa] text-night" },
] as const;

export function MockPaymentButtons({ id, orderId }: { id: string; orderId: string }) {
  const [busy, setBusy] = useState(false);
  const pay = async (outcome: (typeof OUTCOMES)[number]["outcome"]) => {
    setBusy(true);
    await fetch("/api/dev/mock-payment", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, outcome }) });
    window.location.assign(outcome === "canceled" ? "/commande?paiement=annule" : `/suivi/${orderId}?retour=1`);
  };
  return (
    <div className="mt-6 grid gap-3">
      {OUTCOMES.map((o) => (
        <button key={o.outcome} type="button" disabled={busy} onClick={() => pay(o.outcome)} className={`min-h-12 rounded-xl font-bold ${o.className}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
