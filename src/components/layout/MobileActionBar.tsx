"use client";

import Link from "next/link";
import { AnimatePresence, m } from "framer-motion";
import { Clock, MapPin, Phone, UtensilsCrossed } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Barre fixe mobile : Appeler + Itinéraire, visible une fois le hero quitté.
 * Si le téléphone ou l'adresse ne sont pas encore renseignés, elle propose
 * la carte et les horaires à la place (jamais de bouton mort).
 */
export function MobileActionBar({
  phoneHref,
  directionsHref,
}: {
  phoneHref: string | null;
  directionsHref: string | null;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const hero = document.getElementById("hero");
      const threshold = hero ? hero.offsetHeight - 120 : 280;
      setVisible(window.scrollY > threshold);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const item =
    "flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-full text-[15px] font-semibold";

  return (
    <AnimatePresence>
      {visible && (
        <m.div
          initial={{ y: 96 }}
          animate={{ y: 0 }}
          exit={{ y: 96 }}
          transition={{ type: "spring", stiffness: 380, damping: 36 }}
          className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden"
        >
          <div className="flex gap-2 rounded-full border border-white/10 bg-night/92 p-1.5 shadow-[0_18px_40px_-12px_rgba(6,19,46,0.8)] backdrop-blur-md">
            {phoneHref ? (
              <a href={phoneHref} className={`${item} bg-white/8 text-white`}>
                <Phone className="size-[18px]" aria-hidden="true" /> Appeler
              </a>
            ) : (
              <Link href="/menu" className={`${item} bg-white/8 text-white`}>
                <UtensilsCrossed className="size-[18px]" aria-hidden="true" /> La carte
              </Link>
            )}
            {directionsHref ? (
              <a
                href={directionsHref}
                target="_blank"
                rel="noopener noreferrer"
                className={`${item} bg-sand text-night`}
              >
                <MapPin className="size-[18px]" aria-hidden="true" /> Itinéraire
              </a>
            ) : (
              <Link href="/contact#horaires" className={`${item} bg-sand text-night`}>
                <Clock className="size-[18px]" aria-hidden="true" /> Horaires
              </Link>
            )}
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
