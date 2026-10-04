import Image from "next/image";
import type { ReactNode } from "react";
import { HalalBadge } from "@/components/ui/HalalBadge";
import { images, type ImageKey } from "@/data/images";
import { cn } from "@/lib/utils";

/**
 * Plats de l'en-tête, en « perles » rondes (anneau blanc + bleu nazar, comme le logo).
 * Positions dans un cadre de 460 × 400 px (grand écran) ; `motion` : délai d'apparition et décalage du flottement.
 */
const CLUSTER: { key: ImageKey; px: number; className: string; motion: string }[] = [
  { key: "assiette-mixte-carre", px: 244, className: "top-[78px] left-[64px] size-[244px]", motion: "[--d:.15s] [--f:0s]" },
  { key: "berliner-kebab-carre", px: 150, className: "top-0 left-[286px] size-[150px]", motion: "[--d:.3s] [--f:-2s]" },
  { key: "double-cheese-carre", px: 168, className: "top-[226px] left-[284px] size-[168px]", motion: "[--d:.45s] [--f:-4s]" },
  { key: "assiette-poulet-carre", px: 112, className: "top-[284px] left-0 size-[112px]", motion: "[--d:.6s] [--f:-1s]" },
];

/** Mobile et tablette : rangée de plats qui se chevauchent (moins de plats sur les petits écrans). */
const STRIP: { key: ImageKey; className: string }[] = [
  { key: "assiette-mixte-carre", className: "z-50 [--d:.2s]" },
  { key: "berliner-kebab-carre", className: "z-40 [--d:.28s]" },
  { key: "double-cheese-carre", className: "z-30 [--d:.36s]" },
  { key: "assiette-poulet-carre", className: "z-20 [--d:.44s] max-[359px]:hidden" },
  { key: "sandwich-merguez-carre", className: "z-10 [--d:.52s] max-sm:hidden" },
];

/** En-tête de la carte : bandeau bleu, quelques plats pour ouvrir l'appétit et le logo Halal. */
export function MenuHero({ title, eyebrow, children }: { title: string; eyebrow?: string; children?: ReactNode }) {
  return (
    <div className="grain on-dark relative overflow-hidden pt-[calc(var(--header-h)+40px)] pb-24 lg:pt-[calc(var(--header-h)+56px)] lg:pb-32">
      <div aria-hidden="true" className="pointer-events-none absolute -top-48 right-[-12%] size-[680px] rounded-full bg-royal/55 blur-[130px]" />
      <div className="container-x relative grid items-center gap-10 lg:grid-cols-[1fr_460px]">
        <div>
          {eyebrow && <p className="hero-in eyebrow text-nazar [--d:0s]">{eyebrow}</p>}
          <h1 className="hero-in display mt-3 text-[clamp(3.4rem,10vw,7rem)] text-white [--d:.05s]">{title}</h1>
          {children && <div className="hero-in mt-5 max-w-[46ch] text-lg text-fog [--d:.12s]">{children}</div>}
          <div className="mt-8 flex items-center gap-4 lg:hidden">
            <ul aria-hidden="true" className="flex -space-x-3">
              {STRIP.map((dish) => (
                <li key={dish.key} className={cn("hero-pop relative size-16 overflow-hidden rounded-full bg-night-2 ring-[3px] ring-white sm:size-20", dish.className)}>
                  <Image src={images[dish.key].src} alt="" fill sizes="80px" className="object-cover" />
                </li>
              ))}
            </ul>
            <HalalBadge compact className="hero-pop ml-auto size-16 drop-shadow-[0_12px_20px_rgba(0,0,0,0.4)] [--d:.6s] sm:size-20" />
          </div>
        </div>

        <div className="relative hidden h-[400px] w-[460px] lg:block">
          {CLUSTER.map((dish) => (
            <div key={dish.key} aria-hidden="true" className={cn("hero-pop absolute", dish.className, dish.motion)}>
              <div className="bead-float size-full rounded-full bg-white p-[5px] shadow-[0_28px_60px_-24px_rgba(0,0,0,0.75)] ring-[3px] ring-nazar">
                <div className="relative size-full overflow-hidden rounded-full">
                  <Image src={images[dish.key].src} alt="" fill sizes={`${dish.px}px`} className="object-cover" />
                </div>
              </div>
            </div>
          ))}
          <div className="hero-pop absolute top-0 left-0 size-28 [--d:.75s] [--f:-5s]">
            <HalalBadge className="bead-float size-full drop-shadow-[0_18px_28px_rgba(0,0,0,0.45)]" />
          </div>
          {/* La perle bleue du logo, en clin d'œil. */}
          <div aria-hidden="true" className="hero-pop absolute top-[336px] left-[180px] size-14 [--d:.85s] [--f:-3s]">
            <Nazar className="bead-float size-full drop-shadow-[0_10px_18px_rgba(0,0,0,0.45)]" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Perle nazar (œil bleu) du logo. */
function Nazar({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className}>
      <circle cx="50" cy="50" r="50" fill="#0140b8" />
      <circle cx="50" cy="50" r="35" fill="#fff" />
      <circle cx="50" cy="50" r="25" fill="#8cc8f2" />
      <circle cx="50" cy="50" r="12" fill="#06132e" />
      <ellipse cx="34" cy="28" rx="12" ry="7" fill="#fff" opacity="0.35" transform="rotate(-35 34 28)" />
    </svg>
  );
}
