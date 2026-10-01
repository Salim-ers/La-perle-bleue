import { Gallery } from "@/components/gallery/Gallery";
import { ButtonLink } from "@/components/ui/Button";
import { galleryPreviewKeys } from "@/data/images";

export function GalleryPreview() {
  return (
    <section aria-labelledby="galerie-title" className="bg-cream py-20 text-night lg:py-32">
      <div className="container-x">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow text-royal">Le restaurant</p>
            <h2 id="galerie-title" className="display mt-3 text-[clamp(2.8rem,6vw,4.6rem)] text-deep">
              En images
            </h2>
          </div>
          <ButtonLink href="/galerie" variant="outline-dark">
            Toute la galerie
          </ButtonLink>
        </div>
        <Gallery keys={galleryPreviewKeys} layout="feature" className="mt-12" />
      </div>
    </section>
  );
}
