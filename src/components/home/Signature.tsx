import Image from "next/image";
import { images } from "@/data/images";
import { Reveal } from "@/components/ui/Reveal";

export function Signature() {
  const main = images["salle"];
  const detail = images["vitrine-cuisine"];
  return (
    <section aria-labelledby="signature-title" className="bg-white py-20 text-night lg:py-32">
      <div className="container-x grid items-center gap-12 lg:grid-cols-[55fr_45fr] lg:gap-20">
        <div className="relative pb-14 lg:pb-20">
          <Reveal variant="clip">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[4px]">
              <Image
                src={main.src}
                alt={main.alt}
                fill
                placeholder="blur"
                sizes="(min-width: 1024px) 640px, 100vw"
                className="object-cover"
              />
            </div>
          </Reveal>
          <div className="absolute right-0 bottom-0 w-[46%] overflow-hidden rounded-[4px] border-[6px] border-white shadow-[0_24px_50px_-24px_rgba(6,19,46,0.45)] lg:-right-10">
            <div className="relative aspect-[4/3]">
              <Image
                src={detail.src}
                alt={detail.alt}
                fill
                placeholder="blur"
                sizes="(min-width: 1024px) 300px, 46vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>

        <div className="max-w-[52ch]">
          <h2 id="signature-title" className="display text-[clamp(2.8rem,6vw,4.6rem)] text-deep">
            Une vraie passion du goût.
          </h2>
          <div className="mt-8 space-y-5 text-[17px] leading-[1.7] text-slate">
            <p>
              À La Perle Bleue, la carte tourne autour du grill et de la broche : brochettes
              d&apos;agneau, adana, kefta, entrecôte, poulet et kebab, servis en sandwich, en tacos
              ou en assiette.
            </p>
            <p>
              Les assiettes arrivent avec boulgour, frites et crudités. Les tacos sont garnis de
              frites et de notre sauce fromagère maison.
            </p>
            <p>
              Une salle aux banquettes bleues pour prendre le temps, un comptoir pour emporter.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
