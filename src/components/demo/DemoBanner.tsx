"use client";

import Link from "next/link";
import { FlaskConical } from "lucide-react";
import { useDemo } from "@/features/demo/store";
import { useLiveStore } from "@/features/live/store";

/** Bandeau visible sur toutes les pages en mode démonstration. */
export function DemoBanner() {
  const active = useDemo((s) => s.active);
  if (!active) return null;
  return (
    <div
      role="status"
      className="fixed bottom-24 left-3 z-[45] flex max-w-[calc(100vw-1.5rem)] flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl bg-[#7a2e0e] px-4 py-2.5 text-[13px] font-semibold text-white shadow-lg lg:bottom-4"
    >
      <span className="flex items-center gap-1.5 font-bold tracking-wide uppercase">
        <FlaskConical className="size-4" aria-hidden="true" /> Mode démo
      </span>
      <span className="text-white/85">Aucune commande transmise, aucun paiement.</span>
      <Link href="/demo/cuisine" target="_blank" className="underline underline-offset-2">
        Ouvrir la cuisine
      </Link>
      <button
        type="button"
        onClick={() => {
          useDemo.getState().set(false);
          void useLiveStore.getState().refresh();
        }}
        className="underline underline-offset-2"
      >
        Quitter
      </button>
    </div>
  );
}
