import { Hero } from "@/components/home/Hero";
import { Signature } from "@/components/home/Signature";
import { Incontournables } from "@/components/home/Incontournables";
import { BigVisual } from "@/components/home/BigVisual";
import { MenuPreview } from "@/components/home/MenuPreview";
import { SavoirFaire } from "@/components/home/SavoirFaire";
import { GalleryPreview } from "@/components/home/GalleryPreview";
import { Reviews } from "@/components/home/Reviews";
import { FinalCta } from "@/components/home/FinalCta";
import { VisitUs } from "@/components/info/VisitUs";
import { featuredIds, getMenu, getReviews } from "@/lib/data";
import { directionsHref, phoneHref, reviewsHref, shortAddress, showReviews } from "@/lib/contact";

export default async function HomePage() {
  const [{ categories, products, tacos }, reviews] = await Promise.all([getMenu(), getReviews()]);
  const featured = featuredIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => !!p);

  return (
    <>
      <Hero directionsHref={directionsHref} shortAddress={shortAddress} />
      <Signature />
      <Incontournables products={featured} />
      <BigVisual />
      <MenuPreview categories={categories} products={products} tacos={tacos} />
      <SavoirFaire />
      <GalleryPreview />
      {showReviews && <Reviews reviews={reviews} reviewsHref={reviewsHref} />}
      <VisitUs />
      <FinalCta directionsHref={directionsHref} phoneHref={phoneHref} />
    </>
  );
}
