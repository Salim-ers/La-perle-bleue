import type { Metadata } from "next";
import { InfoBar } from "@/components/layout/InfoBar";
import { MenuBrowser } from "@/components/menu/MenuBrowser";
import { MenuHero } from "@/components/menu/MenuHero";
import { getMenu } from "@/lib/data";
import { city } from "@/lib/site";

export const metadata: Metadata = {
  title: "Notre carte",
  description: `La carte de La Perle Bleue${city ? ` à ${city}` : ""} : assiettes grillées, sandwichs, tacos, burgers, paninis, desserts et boissons, avec les prix.`,
  alternates: { canonical: "/menu" },
};

export default async function MenuPage() {
  const { categories, products, tacos } = await getMenu();
  return (
    <div className="nappe">
      <MenuHero title="Notre carte" eyebrow="À emporter ou sur place">
        Assiettes grillées, sandwichs, tacos et burgers. Touchez « + » pour composer votre commande, à
        retirer sur place.
      </MenuHero>
      <div className="relative pb-16 sm:pb-24">
        <div aria-hidden="true" className="perles pointer-events-none absolute inset-0" />
        {/* La carte, posée comme une feuille sur la nappe bleue (overflow-clip : la barre de catégories reste collante). */}
        <div className="relative mx-2 -mt-14 overflow-clip rounded-[28px] bg-white text-night shadow-[0_40px_90px_-40px_rgba(0,0,0,0.7)] sm:mx-4 lg:mx-auto lg:-mt-20 lg:w-[calc(100%-48px)] lg:max-w-[1240px] lg:rounded-[36px]">
          <InfoBar />
          <MenuBrowser categories={categories} products={products} tacos={tacos} />
        </div>
      </div>
    </div>
  );
}
