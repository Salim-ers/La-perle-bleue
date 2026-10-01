"use client";

import Image from "next/image";
import { m } from "framer-motion";
import { Plus } from "lucide-react";
import { images, type ImageKey } from "@/data/images";
import { formatPrice, spokenPrice } from "@/data/menu";
import { startOrder } from "@/features/cart/ui";
import { cn } from "@/lib/utils";

export interface ProductCardProps {
  id: string;
  name: string;
  description?: string;
  /** Prix de base en centimes. */
  price: number;
  image?: ImageKey;
  /** Libellé de catégorie affiché au-dessus du nom (« Assiette »). */
  category?: string;
  badge?: string;
  available: boolean;
  /** Chargement prioritaire (cartes visibles sans défiler). */
  priority?: boolean;
  className?: string;
}

const badgeTone = (badge: string) => {
  const b = badge.toLowerCase();
  if (b.includes("nouveau")) return "bg-royal text-white";
  if (b.includes("généreux")) return "bg-ember text-white";
  return "bg-sand text-night";
};

/**
 * Carte produit commerciale : grande photo, nom, prix, bouton Ajouter.
 * Toute la carte est cliquable (lien étiré sur le bouton) : un seul arrêt clavier.
 */
export function ProductCard({
  id,
  name,
  description,
  price,
  image,
  category,
  badge,
  available,
  priority,
  className,
}: ProductCardProps) {
  const img = image ? images[image] : null;
  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-[22px] bg-white shadow-[0_1px_0_rgba(6,19,46,0.04),0_24px_48px_-30px_rgba(6,19,46,0.45)] transition-shadow duration-500 hover:shadow-[0_1px_0_rgba(6,19,46,0.04),0_30px_60px_-28px_rgba(6,19,46,0.55)]",
        !available && "opacity-70",
        className,
      )}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-paper">
        {img && (
          <Image
            src={img.src}
            alt={img.alt}
            fill
            placeholder="blur"
            priority={priority}
            sizes="(min-width: 1024px) 290px, (min-width: 640px) 45vw, 78vw"
            className="object-cover transition-transform duration-700 ease-[var(--ease-soft)] group-hover:scale-[1.06]"
          />
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-night/35 to-transparent" />
        {badge && (
          <span
            className={cn(
              "absolute top-4 left-4 rounded-full px-3 py-1.5 text-[11px] font-bold tracking-[0.08em] uppercase",
              badgeTone(badge),
            )}
          >
            {badge}
          </span>
        )}
        {!available && (
          <span className="absolute inset-x-4 top-1/2 -translate-y-1/2 rounded-full bg-night/85 py-2 text-center text-sm font-semibold text-white">
            Momentanément indisponible
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        {category && (
          <p className="text-[11px] font-bold tracking-[0.12em] text-royal uppercase">{category}</p>
        )}
        <h3 className="display mt-1.5 text-[2.1rem] text-night">{name}</h3>
        {description && <p className="mt-2 line-clamp-2 text-[15px] leading-snug text-slate">{description}</p>}
        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          <p className="font-display text-[28px] leading-none font-extrabold text-deep tabular-nums">
            <span aria-hidden="true">{formatPrice(price)}</span>
            <span className="sr-only">{spokenPrice(price)}</span>
          </p>
          <m.button
            type="button"
            onClick={() => startOrder(id)}
            disabled={!available}
            whileTap={{ scale: 0.94 }}
            aria-label={`Ajouter : ${name}`}
            className={cn(
              "inline-flex min-h-12 items-center gap-2 rounded-full px-5 text-[13.5px] font-bold tracking-[0.06em] uppercase transition-[background-color,color,box-shadow,transform] duration-300",
              // Mobile : bouton plein, toujours visible. Desktop : il s'affirme au survol de la carte.
              "bg-royal text-white shadow-[0_12px_24px_-12px_rgba(1,64,184,0.9)]",
              "lg:bg-royal/8 lg:text-royal lg:shadow-none lg:group-hover:bg-royal lg:group-hover:text-white lg:group-hover:shadow-[0_12px_24px_-12px_rgba(1,64,184,0.9)]",
              "after:absolute after:inset-0 after:content-[''] disabled:opacity-50",
            )}
          >
            <Plus className="size-4" strokeWidth={2.75} aria-hidden="true" />
            Ajouter
          </m.button>
        </div>
      </div>
    </article>
  );
}
