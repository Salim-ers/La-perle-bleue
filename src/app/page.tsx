import { InfoBar } from "@/components/layout/InfoBar";
import { Hero } from "@/components/home/Hero";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { HowItWorks } from "@/components/home/HowItWorks";
import { BigVisual } from "@/components/home/BigVisual";
import { MenuPreview } from "@/components/home/MenuPreview";
import { SavoirFaire } from "@/components/home/SavoirFaire";
import { GalleryPreview } from "@/components/home/GalleryPreview";
import { Reviews } from "@/components/home/Reviews";
import { FinalCta } from "@/components/home/FinalCta";
import { RestaurantInfo } from "@/components/info/RestaurantInfo";
import type { ProductCardProps } from "@/components/order/ProductCard";
import { getProduct } from "@/features/order/catalog";
import { featured, getMenu, getReviews } from "@/lib/data";
import { directionsHref, phoneHref, reviewsHref, showReviews } from "@/lib/contact";

const categoryLabel: Partial<Record<string, string>> = {
  assiettes: "Assiette",
  sandwichs: "Sandwich",
  burgers: "Burger",
  tacos: "Tacos",
};

export default async function HomePage() {
  const [{ categories, products, tacos }, reviews] = await Promise.all([getMenu(), getReviews()]);

  const favorites: ProductCardProps[] = featured.flatMap((f) => {
    const p = getProduct(f.id);
    if (!p) return [];
    return [
      {
        id: p.id,
        name: p.name,
        description: f.pitch,
        price: p.basePrice,
        image: f.image,
        category: categoryLabel[p.category],
        badge: f.badge ?? p.badge,
        available: p.available,
      },
    ];
  });

  return (
    <>
      <div className="pt-[var(--header-h)]">
        <InfoBar />
      </div>
      <Hero />
      <FeaturedProducts products={favorites} />
      <HowItWorks />
      <BigVisual />
      <MenuPreview categories={categories} products={products} tacos={tacos} />
      <SavoirFaire />
      <GalleryPreview />
      {showReviews && <Reviews reviews={reviews} reviewsHref={reviewsHref} />}
      <RestaurantInfo />
      <FinalCta directionsHref={directionsHref} phoneHref={phoneHref} />
    </>
  );
}
