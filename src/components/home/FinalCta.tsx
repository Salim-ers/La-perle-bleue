import { ArrowRight, MapPin, Phone } from "lucide-react";
import { Perle } from "@/components/ui/Perle";
import { ButtonLink } from "@/components/ui/Button";
import { restaurant } from "@/data/restaurant";
import { hoursSummary } from "@/lib/hours";

export function FinalCta({
  directionsHref,
  phoneHref,
}: {
  directionsHref: string | null;
  phoneHref: string | null;
}) {
  const summary = hoursSummary(restaurant.openingHours);
  return (
    <section aria-labelledby="faim-title" className="grain on-dark overflow-hidden bg-night py-20 lg:py-28">
      <div className="container-x grid items-center gap-12 lg:grid-cols-[1fr_1.1fr]">
        <Perle
          image="assiette-entrecote-carre"
          sizes="(min-width: 1024px) 460px, 70vw"
          className="mx-auto w-[min(70vw,460px)] lg:order-2"
        />
        <div className="text-center lg:text-left">
          <h2 id="faim-title" className="display text-[clamp(3.4rem,10vw,7rem)] text-white">
            Une petite faim ?
          </h2>
          <p className="mx-auto mt-5 max-w-[36ch] text-lg text-white/80 lg:mx-0">
            Commandez en ligne, récupérez au comptoir. Ou venez vous installer{summary ? `, ${summary}` : ""}.
          </p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap lg:justify-start">
            <ButtonLink href="/menu" size="lg">
              Commander
              <ArrowRight className="size-[18px]" aria-hidden="true" />
            </ButtonLink>
            <ButtonLink href={directionsHref} variant="ghost" size="lg" icon={<MapPin className="size-4" aria-hidden="true" />}>
              Itinéraire
            </ButtonLink>
            <ButtonLink href={phoneHref} variant="ghost" size="lg" icon={<Phone className="size-4" aria-hidden="true" />}>
              Appeler
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
