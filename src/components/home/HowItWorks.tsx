import Image from "next/image";
import { ArrowRight, Flame, Lock, Timer } from "lucide-react";
import { images, type ImageKey } from "@/data/images";
import { orderingSettings } from "@/data/ordering";
import { ButtonLink } from "@/components/ui/Button";
import { StaggerItem, StaggerList } from "@/components/ui/Stagger";

const steps: { n: string; title: string; text: string; image: ImageKey }[] = [
  { n: "01", title: "Choisissez", text: "Kebab, tacos, burger ou assiette.", image: "hero-assiettes" },
  { n: "02", title: "Personnalisez", text: "Sauces, crudités et suppléments.", image: "vitrine-cuisine" },
  { n: "03", title: "Récupérez", text: "Votre commande vous attend au restaurant.", image: "comptoir-commandes" },
];

const { min, max } = orderingSettings.prepTime;
const trust = [
  { icon: Lock, title: "Paiement sécurisé", text: "Carte bancaire via Stripe, bientôt disponible." },
  { icon: Timer, title: "Retrait rapide", text: `Prête en ${min} à ${max} minutes environ.` },
  { icon: Flame, title: "Préparé à la commande", text: "Lancée en cuisine dès sa validation." },
];

export function HowItWorks() {
  return (
    <section aria-labelledby="etapes-title" className="grain on-dark bg-night py-20 lg:py-28">
      <div className="container-x">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow text-nazar">Click &amp; collect</p>
            <h2 id="etapes-title" className="display mt-3 text-[clamp(2.8rem,6.4vw,5rem)] text-white">
              Commandez. Payez. Récupérez.
            </h2>
          </div>
          <div className="hidden lg:block">
            <ButtonLink href="/menu" size="lg">
              Commander
              <ArrowRight className="size-[18px]" aria-hidden="true" />
            </ButtonLink>
          </div>
        </div>

        <StaggerList label="Les étapes" className="mt-12 grid gap-4 md:grid-cols-3 md:gap-6 lg:mt-16">
          {steps.map((s) => {
            const img = images[s.image];
            return (
              <StaggerItem
                key={s.n}
                className="group flex items-center gap-5 rounded-[22px] bg-white/[0.04] p-3 ring-1 ring-white/10 md:block md:p-0 md:ring-0"
              >
                <div className="relative aspect-square w-[104px] shrink-0 overflow-hidden rounded-2xl md:aspect-[4/3] md:w-full md:rounded-[22px]">
                  <Image
                    src={img.src}
                    alt=""
                    fill
                    placeholder="blur"
                    sizes="(min-width: 768px) 380px, 104px"
                    className="object-cover transition-transform duration-700 ease-[var(--ease-soft)] group-hover:scale-[1.04]"
                  />
                  <span className="absolute inset-0 hidden bg-gradient-to-t from-night/70 via-transparent md:block" />
                  <span className="absolute bottom-3 left-5 hidden font-display text-[88px] leading-[0.8] font-black text-sand md:block">
                    {s.n}
                  </span>
                </div>
                <div className="min-w-0 md:pt-6">
                  <p className="font-display text-2xl font-black text-sand md:hidden">{s.n}</p>
                  <h3 className="display text-[2rem] text-white md:text-[2.4rem]">{s.title}</h3>
                  <p className="mt-1 text-[16px] leading-snug text-fog md:mt-2 md:text-[17px]">{s.text}</p>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerList>

        <ul className="mt-14 grid gap-6 border-t border-white/10 pt-10 sm:grid-cols-3 lg:mt-20">
          {trust.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex items-start gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-royal text-white">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-[17px] font-bold text-white">{title}</p>
                <p className="mt-0.5 text-[15px] text-fog">{text}</p>
              </div>
            </li>
          ))}
        </ul>

        <ButtonLink href="/menu" size="lg" className="mt-12 w-full sm:w-auto lg:hidden">
          Commander
          <ArrowRight className="size-[18px]" aria-hidden="true" />
        </ButtonLink>
      </div>
    </section>
  );
}
