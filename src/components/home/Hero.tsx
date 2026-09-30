import Image from "next/image";
import { MapPin } from "lucide-react";
import { images } from "@/data/images";
import { ButtonLink } from "@/components/ui/Button";
import { OpenStatus } from "@/components/info/OpenStatus";

/**
 * Hero : animation en CSS pur (classes .hero-*) pour que l'image et le titre
 * s'affichent sans attendre le JavaScript (meilleur LCP).
 */
export function Hero({
  directionsHref,
  shortAddress,
}: {
  directionsHref: string | null;
  shortAddress: string | null;
}) {
  const plate = images["assiette-poulet-carre"];
  return (
    <section
      id="hero"
      aria-labelledby="hero-title"
      className="grain relative flex min-h-[100svh] items-center overflow-hidden bg-night pt-[var(--header-h)] lg:min-h-[94vh]"
    >
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <Image
          src={images["hero-fond"].src}
          alt=""
          fill
          sizes="100vw"
          quality={50}
          className="scale-110 object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_45%,rgba(6,19,46,0.35),rgba(6,19,46,0.92)_62%)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-night to-transparent" />
      </div>

      <div className="container-x grid w-full items-center gap-10 pt-6 pb-16 lg:grid-cols-[1.02fr_1fr] lg:gap-16 lg:py-20">
        {/* La perle */}
        <div className="relative mx-auto w-[min(76vw,390px)] lg:order-2 lg:w-full lg:max-w-[560px]">
          <div aria-hidden="true" className="hero-ring absolute -inset-[5%] rounded-full border border-sand/35" />
          <div className="hero-perle relative aspect-square rounded-full bg-nazar p-[3.4%]">
            <div className="h-full rounded-full bg-white p-[2.4%]">
              <div className="hero-photo relative h-full overflow-hidden rounded-full bg-night-2">
                <div className="hero-plate absolute inset-0">
                  <Image
                    src={plate.src}
                    alt={plate.alt}
                    fill
                    priority
                    fetchPriority="high"
                    sizes="(min-width: 1024px) 520px, 76vw"
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Texte */}
        <div className="max-w-xl lg:order-1">
          <div className="hero-in [--d:.15s]">
            <OpenStatus />
          </div>
          <h1 id="hero-title" className="hero-in display mt-6 text-[clamp(3.4rem,11vw,6.6rem)] text-white [--d:.2s]">
            <span className="sr-only">La Perle Bleue, restaurant grillade. </span>
            Du grill à l&apos;assiette.
          </h1>
          <p className="hero-in mt-6 max-w-[34ch] text-lg leading-relaxed text-white/80 [--d:.3s] lg:text-xl">
            Kebabs, tacos, burgers, sandwichs et grandes assiettes grillées. Sur place ou à emporter.
          </p>
          <div className="hero-in mt-9 flex flex-wrap gap-3 [--d:.4s]">
            <ButtonLink href="/menu" variant="sand">
              Découvrir la carte
            </ButtonLink>
            <ButtonLink
              href={directionsHref ?? "/contact"}
              variant="ghost"
              icon={<MapPin className="size-4" aria-hidden="true" />}
            >
              Nous trouver
            </ButtonLink>
          </div>
          {shortAddress && (
            <p className="hero-in mt-7 flex items-center gap-2 text-sm text-fog [--d:.5s]">
              <MapPin className="size-4 text-nazar" aria-hidden="true" />
              {shortAddress}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
