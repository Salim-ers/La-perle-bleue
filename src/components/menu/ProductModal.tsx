"use client";

import Image from "next/image";
import { Plus, X } from "lucide-react";
import { useState } from "react";
import { images } from "@/data/images";
import type { MenuProduct } from "@/data/menu";
import { startOrder } from "@/features/cart/ui";
import { buttonClasses } from "@/components/ui/Button";
import { PriceBadge } from "@/components/ui/PriceBadge";
import { Sheet } from "@/components/ui/Sheet";

/** Grande photo d'un produit, avec ajout au panier. */
export function ProductModal({ product, onClose }: { product: MenuProduct | null; onClose: () => void }) {
  // Garde le contenu à l'écran pendant l'animation de fermeture.
  const [shown, setShown] = useState<MenuProduct | null>(null);
  if (product && product !== shown) setShown(product);
  const display = product ?? shown;
  const img = display?.imageKey ? images[display.imageKey] : null;

  return (
    <Sheet open={!!product?.imageKey} onClose={onClose} labelledBy="modal-title" className="md:max-w-lg">
      {display && img && (
        <>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="absolute top-3 right-3 z-20 grid size-11 place-items-center rounded-full bg-night/70 text-white backdrop-blur hover:bg-night"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="relative aspect-square">
              <Image src={img.src} alt={img.alt} fill placeholder="blur" sizes="(min-width: 768px) 512px, 100vw" className="object-cover" />
            </div>
            <div className="flex items-start justify-between gap-4 p-6">
              <div>
                <h2 id="modal-title" className="display text-4xl text-deep">
                  {display.name}
                </h2>
                {display.description && <p className="mt-2 text-slate">{display.description}</p>}
              </div>
              {display.price !== null && <PriceBadge cents={display.price} />}
            </div>
          </div>
          <div className="border-t border-line p-4">
            <button
              type="button"
              data-autofocus
              onClick={() => {
                onClose();
                startOrder(display.id);
              }}
              className={buttonClasses({ size: "lg", className: "w-full" })}
            >
              <Plus className="size-[18px]" strokeWidth={2.75} aria-hidden="true" />
              Ajouter au panier
            </button>
          </div>
        </>
      )}
    </Sheet>
  );
}
