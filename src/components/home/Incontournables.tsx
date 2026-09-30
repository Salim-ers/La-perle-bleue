import Image from "next/image";
import Link from "next/link";
import { images } from "@/data/images";
import type { MenuProduct } from "@/data/menu";
import { PriceBadge } from "@/components/ui/PriceBadge";
import { cn } from "@/lib/utils";

/** Grandes photos 4:5 associées aux produits phares (clé carrée -> clé 4:5). */
const portrait = {
  "assiette-mixte-carre": "assiette-mixte",
  "berliner-kebab-carre": "berliner-kebab",
  "assiette-entrecote-carre": "assiette-entrecote",
  "assiette-poulet-carre": "assiette-poulet",
} as const;

const label: Record<string, string> = {
  assiettes: "Assiette",
  sandwichs: "Sandwich",
};

export function Incontournables({ products }: { products: MenuProduct[] }) {
  return (
    <section
      id="incontournables"
      aria-labelledby="incontournables-title"
      className="grain overflow-hidden bg-night py-20 lg:py-32"
    >
      <div className="container-x flex flex-wrap items-end justify-between gap-6">
        <h2 id="incontournables-title" className="display text-[clamp(2.8rem,6vw,4.6rem)] text-white">
          Nos incontournables
        </h2>
        <Link href="/menu" className="link-line pb-2 font-semibold text-sand">
          Toute la carte
        </Link>
      </div>

      <ul
        className="no-scrollbar mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 lg:container-x lg:mt-16 lg:grid lg:grid-cols-4 lg:gap-6 lg:overflow-visible lg:px-10 lg:pb-12"
        aria-label="Produits phares"
      >
        {products.map((p, i) => {
          const key = p.imageKey ? portrait[p.imageKey as keyof typeof portrait] : undefined;
          const img = key ? images[key] : null;
          return (
            <li
              key={p.id}
              className={cn(
                "w-[78vw] max-w-[340px] shrink-0 snap-start lg:w-auto lg:max-w-none",
                i % 2 === 1 && "lg:translate-y-12",
              )}
            >
              <article className="group relative">
                <div className="relative aspect-[4/5] overflow-hidden rounded-[4px] bg-night-2">
                  {img && (
                    <Image
                      src={img.src}
                      alt={img.alt}
                      fill
                      placeholder="blur"
                      sizes="(min-width: 1024px) 280px, 78vw"
                      className="object-cover transition-transform duration-700 ease-[var(--ease-soft)] group-hover:scale-[1.04]"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-night/90 via-night/20 to-transparent" />
                  {p.badge && (
                    <span className="absolute top-4 left-4 rounded-full bg-sand px-3 py-1 text-sm font-semibold text-night">
                      {p.badge}
                    </span>
                  )}
                  {p.price !== null && <PriceBadge cents={p.price} className="absolute top-4 right-4" />}
                  <div className="absolute inset-x-0 bottom-0 p-5 transition-transform duration-500 ease-[var(--ease-soft)] lg:translate-y-7 lg:group-hover:translate-y-0">
                    <p className="text-sm text-nazar">{label[p.categoryId] ?? ""}</p>
                    <h3 className="display mt-1 text-4xl text-white">{p.name}</h3>
                    {p.description && (
                      <p className="mt-2 text-[15px] leading-snug text-white/80 transition-opacity duration-500 lg:opacity-0 lg:group-hover:opacity-100">
                        {p.description}
                      </p>
                    )}
                  </div>
                </div>
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
