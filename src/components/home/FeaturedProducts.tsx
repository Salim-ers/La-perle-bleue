import { ArrowRight } from "lucide-react";
import { ProductCard, type ProductCardProps } from "@/components/order/ProductCard";
import { ButtonLink } from "@/components/ui/Button";
import { StaggerItem, StaggerList } from "@/components/ui/Stagger";

/** « Les favoris de La Perle Bleue » : les produits phares, avec ajout direct au panier. */
export function FeaturedProducts({ products }: { products: ProductCardProps[] }) {
  return (
    <section id="favoris" aria-labelledby="favoris-title" className="overflow-hidden bg-paper py-16 lg:pt-24 lg:pb-28">
      <div className="container-x flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow text-royal">Nos spécialités</p>
          <h2 id="favoris-title" className="display mt-3 max-w-[15ch] text-[clamp(2.8rem,6vw,4.8rem)] text-deep">
            Les favoris de La Perle Bleue
          </h2>
          <p className="mt-4 max-w-[44ch] text-lg text-slate">Les valeurs sûres quand on ne sait pas quoi choisir.</p>
        </div>
        <div className="hidden sm:block">
          <ButtonLink href="/menu" variant="outline-dark">
            Toute la carte
            <ArrowRight className="size-4" aria-hidden="true" />
          </ButtonLink>
        </div>
      </div>

      <StaggerList
        label="Produits favoris"
        className="no-scrollbar mt-10 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto px-5 pt-2 pb-8 lg:container-x lg:mt-14 lg:grid lg:grid-cols-4 lg:gap-6 lg:overflow-visible lg:pb-2"
      >
        {products.map((p, i) => (
          <StaggerItem key={p.id} className="w-[78vw] max-w-[330px] shrink-0 snap-start lg:w-auto lg:max-w-none">
            <ProductCard {...p} priority={i < 2} />
          </StaggerItem>
        ))}
      </StaggerList>

      <div className="container-x mt-4 sm:hidden">
        <ButtonLink href="/menu" variant="outline-dark" className="w-full">
          Toute la carte
          <ArrowRight className="size-4" aria-hidden="true" />
        </ButtonLink>
      </div>
    </section>
  );
}
