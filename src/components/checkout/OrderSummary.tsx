"use client";

import { AnimatePresence, m } from "framer-motion";
import { ChevronDown, Lock, Store, Timer } from "lucide-react";
import { useId, useState } from "react";
import { orderingSettings } from "@/data/ordering";
import type { CartLine } from "@/features/cart/store";
import { useOrderUI } from "@/features/cart/ui";
import { formatEuros } from "@/lib/money";
import { cn } from "@/lib/utils";

/** Récapitulatif de commande : panneau fixe sur desktop, repliable sur mobile. */
export function OrderSummary({
  lines,
  subtotal,
  collapsible = false,
}: {
  lines: CartLine[];
  subtotal: number;
  collapsible?: boolean;
}) {
  const uid = useId();
  const [open, setOpen] = useState(false);
  const openCart = useOrderUI((s) => s.openCart);
  const count = lines.reduce((n, l) => n + l.quantity, 0);
  const { min, max } = orderingSettings.prepTime;

  const body = (
    <>
      <ul className="divide-y divide-line">
        {lines.map((l) => (
          <li key={l.lineId} className="flex gap-3 py-4">
            <span className="grid h-7 min-w-7 shrink-0 place-items-center rounded-full bg-paper px-1.5 text-sm font-bold text-night tabular-nums">
              {l.quantity}×
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-night">{l.product.name}</p>
              {l.summary.map((s) => (
                <p key={s} className="text-sm leading-snug text-slate">
                  {s}
                </p>
              ))}
              {l.note && <p className="text-sm text-slate italic">« {l.note} »</p>}
            </div>
            <p className="shrink-0 font-semibold text-night tabular-nums">{formatEuros(l.total)}</p>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={openCart}
        className="link-line mt-1 text-sm font-semibold text-royal"
      >
        Modifier le panier
      </button>
      <dl className="mt-5 space-y-1.5 border-t border-line pt-5 text-[15px]">
        <div className="flex justify-between text-slate">
          <dt>Sous-total</dt>
          <dd className="tabular-nums">{formatEuros(subtotal)}</dd>
        </div>
        <div className="flex justify-between text-slate">
          <dt>Retrait sur place</dt>
          <dd>Gratuit</dd>
        </div>
        <div className="flex items-baseline justify-between pt-2 text-night">
          <dt className="text-lg font-bold">Total</dt>
          <dd className="font-display text-[34px] leading-none font-extrabold tabular-nums">{formatEuros(subtotal)}</dd>
        </div>
      </dl>
      <ul className="mt-6 space-y-2.5 rounded-2xl bg-cream p-4 text-sm text-night">
        <li className="flex items-center gap-2.5">
          <Lock className="size-4 shrink-0 text-royal" aria-hidden="true" />
          Paiement sécurisé
        </li>
        <li className="flex items-center gap-2.5">
          <Store className="size-4 shrink-0 text-royal" aria-hidden="true" />
          Commande à retirer à La Perle Bleue
        </li>
        <li className="flex items-center gap-2.5">
          <Timer className="size-4 shrink-0 text-royal" aria-hidden="true" />
          Prête en {min} à {max} minutes environ
        </li>
      </ul>
    </>
  );

  if (collapsible) {
    return (
      <section className="rounded-[22px] bg-white ring-1 ring-line">
        <h2>
          <button
            type="button"
            aria-expanded={open}
            aria-controls={`${uid}-recap`}
            onClick={() => setOpen((v) => !v)}
            className="flex w-full items-center justify-between gap-3 p-5 text-left"
          >
            <span className="font-bold text-night">
              Récapitulatif{" "}
              <span className="font-medium text-slate">
                ({count} article{count > 1 ? "s" : ""})
              </span>
            </span>
            <span className="flex items-center gap-2 font-display text-2xl font-extrabold text-night tabular-nums">
              {formatEuros(subtotal)}
              <ChevronDown
                className={cn("size-5 text-royal transition-transform duration-300", open && "rotate-180")}
                aria-hidden="true"
              />
            </span>
          </button>
        </h2>
        <AnimatePresence initial={false}>
          {open && (
            <m.div
              id={`${uid}-recap`}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-5">{body}</div>
            </m.div>
          )}
        </AnimatePresence>
      </section>
    );
  }

  return (
    <section
      aria-labelledby={`${uid}-title`}
      className="rounded-[22px] bg-white p-6 shadow-[0_30px_60px_-40px_rgba(6,19,46,0.45)] ring-1 ring-line"
    >
      <h2 id={`${uid}-title`} className="display text-[2rem] text-deep">
        Récapitulatif
      </h2>
      {body}
    </section>
  );
}
