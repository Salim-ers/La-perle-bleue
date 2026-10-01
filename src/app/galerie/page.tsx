import type { Metadata } from "next";
import { PageIntro } from "@/components/layout/PageIntro";
import { Gallery } from "@/components/gallery/Gallery";
import { galleryKeys } from "@/data/images";

export const metadata: Metadata = {
  title: "Galerie",
  description: "Les assiettes, la vitrine, la salle et la façade de La Perle Bleue en photos.",
  alternates: { canonical: "/galerie" },
};

export default function GaleriePage() {
  return (
    <>
      <PageIntro title="Galerie">Le grill, la vitrine, la salle et nos assiettes.</PageIntro>
      <section aria-label="Photos" className="bg-white py-14 lg:py-20">
        <div className="container-x">
          <Gallery keys={galleryKeys} />
        </div>
      </section>
    </>
  );
}
