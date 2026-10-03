"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, m } from "framer-motion";
import { ArrowRight, MapPin, PauseCircle, Phone, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { useCartCount, useCartSubtotal } from "@/features/cart/store";
import { useOrderUI } from "@/features/cart/ui";
import { useOrderingState } from "@/features/live/store";
import { formatEuros } from "@/lib/money";

/**
 * Barre fixe mobile.
 * - Panier non vide : « 2 articles • 18,50 € — Voir le panier ».
 * - Sinon, une fois le hero quitté : « Commander » (+ Appeler / Itinéraire si renseignés).
 * Masquée pendant la commande et le suivi (/commande, /suivi).
 * Commandes suspendues : le bouton Commander affiche le message de pause.
 */
export function MobileActionBar({
  phoneHref,
  directionsHref,
}: {
  phoneHref: string | null;
  directionsHref: string | null;
}) {
  const pathname = usePathname();
  const count = useCartCount();
  const subtotal = useCartSubtotal();
  const openCart = useOrderUI((s) => s.openCart);
  const ordering = useOrderingState();
  const [pastHero, setPastHero] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const hero = document.getElementById("hero");
      setPastHero(window.scrollY > (hero ? hero.offsetTop + hero.offsetHeight - 160 : 240));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  const mode = pathname.startsWith("/commande") || pathname.startsWith("/suivi")
    ? null
    : count > 0
      ? "cart"
      : pastHero && pathname !== "/menu"
        ? "order"
        : null;

  const round = "grid size-[52px] shrink-0 place-items-center rounded-full bg-white/10 text-white";

  return (
    <AnimatePresence mode="wait">
      {mode && (
        <m.div
          key={mode}
          initial={{ y: 110 }}
          animate={{ y: 0 }}
          exit={{ y: 110 }}
          transition={{ type: "spring", stiffness: 380, damping: 34 }}
          className="on-dark fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden"
        >
          {mode === "cart" ? (
            <button
              type="button"
              onClick={openCart}
              className="flex min-h-[60px] w-full items-center justify-between gap-2 rounded-full bg-royal py-1.5 pr-1.5 pl-4 text-white shadow-[0_18px_40px_-12px_rgba(1,64,184,0.75)] min-[400px]:pl-5"
            >
              <span className="flex items-center gap-2 text-[14px] font-semibold whitespace-nowrap tabular-nums">
                <ShoppingBag className="hidden size-5 min-[400px]:block" aria-hidden="true" />
                {count} article{count > 1 ? "s" : ""} • {formatEuros(subtotal)}
              </span>
              <span className="flex min-h-12 items-center gap-1.5 rounded-full bg-white px-3.5 text-[12.5px] font-bold tracking-[0.04em] whitespace-nowrap text-royal uppercase">
                Voir le panier
                <ArrowRight className="hidden size-4 min-[400px]:block" aria-hidden="true" />
              </span>
            </button>
          ) : (
            <div className="flex gap-2 rounded-full border border-white/10 bg-night/92 p-1.5 shadow-[0_18px_40px_-12px_rgba(6,19,46,0.8)] backdrop-blur-md">
              {phoneHref && (
                <a href={phoneHref} className={round} aria-label="Appeler le restaurant">
                  <Phone className="size-5" aria-hidden="true" />
                </a>
              )}
              {directionsHref && (
                <a
                  href={directionsHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={round}
                  aria-label="Itinéraire vers le restaurant"
                >
                  <MapPin className="size-5" aria-hidden="true" />
                </a>
              )}
              {ordering.canOrder ? (
                <Link
                  href="/menu"
                  className="flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-full bg-royal text-[14px] font-bold tracking-[0.06em] text-white uppercase"
                >
                  Commander
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              ) : (
                <span role="status" className="flex min-h-[52px] flex-1 items-center justify-center gap-2 px-3 text-center text-[13px] font-bold text-white/85 uppercase">
                  <PauseCircle className="size-4 shrink-0" aria-hidden="true" />
                  {ordering.message}
                </span>
              )}
            </div>
          )}
        </m.div>
      )}
    </AnimatePresence>
  );
}
