import type { Metadata } from "next";
import { PageIntro } from "@/components/layout/PageIntro";
import { MenuBrowser } from "@/components/menu/MenuBrowser";
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
    <>
      <PageIntro title="Notre carte">
        Assiettes grillées, sandwichs, tacos et burgers. Sur place ou à emporter.
      </PageIntro>
      <div className="bg-white text-night">
        <MenuBrowser categories={categories} products={products} tacos={tacos} />
      </div>
    </>
  );
}
