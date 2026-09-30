"use client";

import Image from "next/image";
import { AnimatePresence, m } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { images } from "@/data/images";
import type { MenuProduct } from "@/data/menu";
import { PriceBadge } from "@/components/ui/PriceBadge";

/** Grande photo d'un produit. Aucune commande dans cette version. */
export function ProductModal({
  product,
  onClose,
}: {
  product: MenuProduct | null;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!product) return;
    const prev = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    document.documentElement.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
      prev?.focus();
    };
  }, [product, onClose]);

  const img = product?.imageKey ? images[product.imageKey] : null;

  return (
    <AnimatePresence>
      {product && img && (
        <m.div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-night/80 backdrop-blur-sm sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <m.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            className="relative w-full max-w-lg overflow-hidden rounded-t-[20px] bg-white text-night shadow-[0_30px_80px_-20px_rgba(6,19,46,0.7)] sm:rounded-[8px]"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-square">
              <Image src={img.src} alt={img.alt} fill placeholder="blur" sizes="(min-width: 640px) 512px, 100vw" className="object-cover" />
            </div>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="absolute top-3 right-3 grid size-11 place-items-center rounded-full bg-night/70 text-white backdrop-blur hover:bg-night"
            >
              <X className="size-5" />
            </button>
            <div className="flex items-start justify-between gap-4 p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
              <div>
                <h2 id="modal-title" className="display text-4xl text-deep">{product.name}</h2>
                {product.description && <p className="mt-2 text-slate">{product.description}</p>}
              </div>
              {product.price !== null && <PriceBadge cents={product.price} />}
            </div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
