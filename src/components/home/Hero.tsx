import Image from "next/image";
import { ArrowRight, Check, Flame } from "lucide-react";
import { images } from "@/data/images";
import { getProduct } from "@/features/order/catalog";
import { ButtonLink } from "@/components/ui/Button";
import { HeroTag } from "./HeroTag";

const promises = ["Préparé à la commande", "Paiement sécurisé prochainement", "Retrait rapide sur place"];

/**
 * Hero commercial : marque + promesse + COMMANDER à gauche, composition
 * photo à droite (en haut sur mobile). Animations en CSS pur (classes .hero-*) :
 * l'image principale et le titre s'affichent sans attendre le JavaScript.
 */
export function Hero() {
  const main = images["assiette-mixte"];
  const second = images["berliner-kebab"];
  const mixte = getProduct("assiette-mixte");
  const berliner = getProduct("berliner-kebab");

  return (
    <section id="hero" aria-labelledby="hero-title" className="relative overflow-hidden bg-cream">
      <div className="container-x grid items-center gap-7 pt-4 pb-14 sm:gap-9 sm:pt-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-10 lg:pt-10 lg:pb-20 xl:gap-16">
        {/* ——— Texte ——— */}
        <div className="relative z-10">
          <p className="hero-in inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-[11.5px] font-bold tracking-[0.16em] text-night uppercase ring-1 ring-line [--d:.05s]">
            <Flame className="size-4 text-ember" aria-hidden="true" />
            Grill • Kebab • Tacos
          </p>
          <h1
            id="hero-title"
            className="hero-in display mt-5 text-[clamp(3.5rem,14.5vw,8.4rem)] leading-[0.86] text-deep uppercase [--d:.1s]"
          >
            La Perle Bleue
            <span className="sr-only"> : kebab, tacos et grillades, sur place ou à emporter</span>
          </h1>
          <p className="hero-in display mt-4 text-[clamp(1.85rem,4.4vw,3.2rem)] font-bold text-night [--d:.18s]">
            Grillé. Généreux. Prêt à emporter.
          </p>
          <p className="hero-in mt-4 hidden max-w-[42ch] text-[17px] leading-relaxed text-slate [--d:.26s] sm:block lg:text-lg">
            Kebabs, tacos, burgers et assiettes grillées préparés à la commande. Sur place ou à emporter.
          </p>
          <div className="hero-in mt-7 flex flex-wrap gap-3 [--d:.34s]">
            <ButtonLink href="/menu" size="lg" className="flex-1 px-10 text-[15px] sm:flex-none">
              Commander
              <ArrowRight className="size-[18px] transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </ButtonLink>
            <ButtonLink href="#carte" variant="outline-dark" size="lg" className="flex-1 sm:flex-none">
              Voir la carte
            </ButtonLink>
          </div>
          <ul className="hero-in mt-7 grid gap-2.5 text-[15px] text-night sm:flex sm:flex-wrap sm:gap-x-6 [--d:.42s]">
            {promises.map((p) => (
              <li key={p} className="flex items-center gap-2.5">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-royal/10">
                  <Check className="size-3.5 text-royal" strokeWidth={3} aria-hidden="true" />
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>

        {/* ——— Composition photo ——— */}
        <div className="relative order-first mb-3 lg:order-none lg:mb-0">
          {/* Anneau discret, écho à la perle du logo */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-[56%] hidden aspect-square w-[118%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-royal/10 lg:block"
          />
          <div className="relative lg:ml-auto lg:w-[86%]">
            <div className="hero-media relative h-[clamp(190px,32svh,340px)] overflow-hidden rounded-[28px] bg-paper shadow-[0_40px_80px_-42px_rgba(6,19,46,0.65)] sm:h-[440px] lg:aspect-[6/7] lg:h-auto">
              <Image
                src={main.src}
                alt={main.alt}
                fill
                priority
                fetchPriority="high"
                placeholder="blur"
                sizes="(min-width: 1280px) 560px, (min-width: 1024px) 46vw, 100vw"
                className="object-cover object-[50%_62%]"
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-night/45 to-transparent" />
              <p className="hero-pop absolute top-4 right-4 hidden items-center gap-2 rounded-full bg-white/92 px-3.5 py-2 text-[11px] font-bold tracking-[0.12em] text-night uppercase backdrop-blur sm:inline-flex [--d:.95s]">
                <Flame className="size-3.5 text-ember" aria-hidden="true" />
                Cuit au grill
              </p>
              {mixte && (
                <HeroTag
                  productId={mixte.id}
                  name={`Assiette ${mixte.name}`}
                  kicker="La plus généreuse"
                  price={mixte.basePrice}
                  className="hero-pop absolute bottom-4 left-4 [--d:.75s] lg:bottom-6 lg:left-auto lg:right-6"
                />
              )}
            </div>

            {/* Deuxième photo, partielle : profondeur */}
            <div className="hero-rise absolute right-3 -bottom-7 w-[29%] max-w-[150px] [--d:.4s] sm:max-w-[190px] lg:right-auto lg:bottom-[10%] lg:-left-[22%] lg:w-[40%] lg:max-w-none">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[18px] border-[5px] border-cream bg-paper shadow-[0_30px_60px_-30px_rgba(6,19,46,0.7)] lg:rounded-[24px] lg:border-[7px]">
                <Image
                  src={second.src}
                  alt={second.alt}
                  fill
                  placeholder="blur"
                  sizes="(min-width: 1024px) 230px, 30vw"
                  className="object-cover"
                />
                <span className="absolute top-2 left-2 rounded-full bg-royal px-2 py-1 text-[9.5px] font-bold tracking-[0.1em] text-white uppercase lg:top-3 lg:left-3 lg:px-2.5 lg:text-[10.5px]">
                  Nouveau
                </span>
              </div>
              {berliner && (
                <div className="absolute -bottom-6 left-1/2 hidden -translate-x-1/2 lg:block">
                  <HeroTag
                    productId={berliner.id}
                    name={berliner.name}
                    kicker="Sandwich"
                    price={berliner.basePrice}
                    className="hero-pop whitespace-nowrap [--d:.9s]"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
