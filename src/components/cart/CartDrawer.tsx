"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, m } from "framer-motion";
import { ArrowRight, Store, X } from "lucide-react";
import { useCartCount, useCartLines, useCartSubtotal } from "@/features/cart/store";
import { useOrderUI } from "@/features/cart/ui";
import { formatEuros } from "@/lib/money";
import { buttonClasses } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { CartItem } from "./CartItem";
import { EmptyCart } from "./EmptyCart";

/** Tiroir panier : à droite sur desktop, en bas d'écran sur mobile. */
export function CartDrawer() {
  const open = useOrderUI((s) => s.cartOpen);
  const close = useOrderUI((s) => s.closeCart);
  const lines = useCartLines();
  const count = useCartCount();
  const subtotal = useCartSubtotal();
  const onCheckout = usePathname() === "/commande";

  return (
    <Sheet open={open} onClose={close} labelledBy="panier-titre" variant="drawer">
      <div className="flex items-center justify-between gap-4 border-b border-line px-5 pt-6 pb-4 md:px-7 md:pt-7">
        <h2 id="panier-titre" className="display text-[2.4rem] text-deep">
          Votre panier
          {count > 0 && <span className="ml-2 align-middle font-sans text-base font-semibold text-slate">({count})</span>}
        </h2>
        <button
          type="button"
          onClick={close}
          aria-label="Fermer le panier"
          className="grid size-11 place-items-center rounded-full text-night transition-colors hover:bg-night/6"
        >
          <X className="size-5" aria-hidden="true" />
        </button>
      </div>

      {lines.length === 0 ? (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <EmptyCart onNavigate={close} />
        </div>
      ) : (
        <>
          <ul className="min-h-0 flex-1 divide-y divide-line overflow-y-auto overscroll-contain px-5 md:px-7">
            <AnimatePresence initial={false}>
              {lines.map((line) => (
                <m.li
                  key={line.lineId}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0, transition: { duration: 0.25 } }}
                  className="overflow-hidden"
                >
                  <CartItem line={line} />
                </m.li>
              ))}
            </AnimatePresence>
          </ul>

          <div className="border-t border-line bg-cream px-5 pt-5 pb-5 md:px-7">
            <dl className="space-y-1.5 text-[15px]">
              <div className="flex justify-between text-slate">
                <dt>Sous-total</dt>
                <dd className="tabular-nums">{formatEuros(subtotal)}</dd>
              </div>
              {/* Phase 2 : frais éventuels / remises, calculés par le serveur. */}
              <div className="flex items-baseline justify-between pt-1 text-night">
                <dt className="text-lg font-bold">Total</dt>
                <dd className="font-display text-3xl font-extrabold tabular-nums">{formatEuros(subtotal)}</dd>
              </div>
            </dl>
            <p className="mt-3 flex items-center gap-2 text-sm text-slate">
              <Store className="size-4 shrink-0 text-royal" aria-hidden="true" />
              Commande à retirer à La Perle Bleue.
            </p>
            {onCheckout ? (
              <button type="button" onClick={close} className={buttonClasses({ size: "lg", className: "mt-4 w-full" })}>
                Continuer ma commande
                <ArrowRight className="size-4" aria-hidden="true" />
              </button>
            ) : (
              <Link href="/commande" onClick={close} className={buttonClasses({ size: "lg", className: "mt-4 w-full" })}>
                Passer la commande
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
            )}
          </div>
        </>
      )}
    </Sheet>
  );
}
