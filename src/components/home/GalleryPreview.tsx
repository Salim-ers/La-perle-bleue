import { Gallery } from "@/components/gallery/Gallery";
import { ButtonLink } from "@/components/ui/Button";
import { galleryPreviewKeys } from "@/data/images";

export function GalleryPreview() {
  return (
    <section aria-labelledby="galerie-title" className="bg-mist py-20 text-night lg:py-32">
      <div className="container-x">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h2 id="galerie-title" className="display text-[clamp(2.8rem,6vw,4.6rem)] text-deep">
            En images
          </h2>
          <ButtonLink href="/galerie" variant="outline-dark">
            Toute la galerie
          </ButtonLink>
        </div>
        <Gallery keys={galleryPreviewKeys} className="mt-12" />
      </div>
    </section>
  );
}
