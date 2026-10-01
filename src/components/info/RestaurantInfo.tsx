import Image from "next/image";
import { Mail, MapPin, Phone } from "lucide-react";
import { images } from "@/data/images";
import { restaurant } from "@/data/restaurant";
import { directionsHref, emailHref, fullAddress, mapEmbedSrc, phoneHref } from "@/lib/contact";
import { ButtonLink } from "@/components/ui/Button";
import { OpenStatus } from "./OpenStatus";
import { OpeningHours } from "./OpeningHours";
import { MapEmbed } from "./MapEmbed";

/**
 * « Venez nous voir ». Adresse, téléphone et liens viennent de src/data/restaurant.ts :
 * tant qu'une donnée vaut TODO_CONTENT, la ligne ou le bouton correspondant est masqué.
 */
export function RestaurantInfo({ headingLevel = "h2" }: { headingLevel?: "h1" | "h2" }) {
  const Heading = headingLevel;
  const img = images["facade"];
  return (
    <section id="nous-trouver" aria-labelledby="visite-title" className="bg-cream py-20 text-night lg:py-32">
      <div className="container-x">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div className="relative order-2 aspect-[4/5] overflow-hidden rounded-[22px] lg:order-1 lg:aspect-auto lg:min-h-[640px]">
            <Image src={img.src} alt={img.alt} fill placeholder="blur" sizes="(min-width: 1024px) 520px, 100vw" className="object-cover" />
          </div>

          <div className="order-1 lg:order-2">
            <Heading id="visite-title" className="display text-[clamp(2.8rem,6vw,4.6rem)] text-deep">
              Venez nous voir.
            </Heading>
            <p className="mt-3 text-lg text-slate">
              {restaurant.name}, {restaurant.tagline.toLowerCase()}. Sur place ou à emporter.
            </p>

            <address className="mt-8 space-y-3 text-[17px] not-italic empty:hidden">
              {fullAddress && (
                <p className="flex items-start gap-3">
                  <MapPin className="mt-1 size-5 shrink-0 text-royal" aria-hidden="true" />
                  <span>{fullAddress}</span>
                </p>
              )}
              {phoneHref && (
                <p className="flex items-center gap-3">
                  <Phone className="size-5 shrink-0 text-royal" aria-hidden="true" />
                  <a href={phoneHref} className="link-line">{restaurant.phone}</a>
                </p>
              )}
              {emailHref && (
                <p className="flex items-center gap-3">
                  <Mail className="size-5 shrink-0 text-royal" aria-hidden="true" />
                  <a href={emailHref} className="link-line">{restaurant.email}</a>
                </p>
              )}
            </address>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/menu" className="min-h-14 sm:min-h-12">
                Commander à emporter
              </ButtonLink>
              <ButtonLink href={directionsHref} variant="outline-dark" icon={<MapPin className="size-4" aria-hidden="true" />} className="min-h-14 sm:min-h-12">
                Itinéraire
              </ButtonLink>
              <ButtonLink href={phoneHref} variant="outline-dark" icon={<Phone className="size-4" aria-hidden="true" />} className="min-h-14 sm:min-h-12">
                Appeler
              </ButtonLink>
            </div>

            <div id="horaires" className="mt-12 scroll-mt-32">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="display text-3xl text-deep">Horaires</h3>
                <OpenStatus tone="light" />
              </div>
              <div className="mt-4">
                <OpeningHours />
              </div>
            </div>
          </div>
        </div>

        {(mapEmbedSrc || directionsHref) && (
          <div className="mt-14 lg:mt-20">
            <MapEmbed src={mapEmbedSrc} directionsHref={directionsHref} />
          </div>
        )}
      </div>
    </section>
  );
}
