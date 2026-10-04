import Image from "next/image";
import type { ReactNode } from "react";
import { HalalBadge } from "@/components/ui/HalalBadge";
import { images, type ImageKey } from "@/data/images";
import { cn } from "@/lib/utils";

/** Plats de l'en-tête, en « perles » rondes (anneau blanc + bleu nazar, comme le logo), dans un cadre de 460 × 400 px. */
const CLUSTER: { key: ImageKey; px: number; className: string }[] = [
  { key: "assiette-mixte-carre", px: 244, className: "top-[78px] left-[64px] size-[244px]" },
  { key: "berliner-kebab-carre", px: 150, className: "top-0 left-[286px] size-[150px]" },
  { key: "double-cheese-carre", px: 168, className: "top-[226px] left-[284px] size-[168px]" },
  { key: "assiette-poulet-carre", px: 112, className: "top-[284px] left-0 size-[112px]" },
];

/** Mobile et tablette : rangée de plats qui se chevauchent (moins de plats sur les petits écrans). */
const STRIP: { key: ImageKey; className: string }[] = [
  { key: "assiette-mixte-carre", className: "z-50" },
  { key: "berliner-kebab-carre", className: "z-40" },
  { key: "double-cheese-carre", className: "z-30" },
  { key: "assiette-poulet-carre", className: "z-20 max-[359px]:hidden" },
  { key: "sandwich-merguez-carre", className: "z-10 max-sm:hidden" },
];

/** En-tête de la carte : titre, quelques plats en perles et le logo Halal (sans animation). */
export function MenuHero({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="bg-cream pt-[calc(var(--header-h)+40px)] pb-12 lg:pt-[calc(var(--header-h)+48px)] lg:pb-14">
      <div className="container-x grid items-center gap-10 lg:grid-cols-[1fr_460px]">
        <div>
          <h1 className="display text-[clamp(3.4rem,10vw,7rem)] text-deep">{title}</h1>
          {children && <div className="mt-5 max-w-[46ch] text-lg text-slate">{children}</div>}
          <div className="mt-8 flex items-center gap-4 lg:hidden">
            <ul aria-hidden="true" className="flex -space-x-3">
              {STRIP.map((dish) => (
                <li
                  key={dish.key}
                  className={cn("relative size-16 overflow-hidden rounded-full bg-paper shadow-[0_8px_18px_-8px_rgba(6,19,46,0.45)] ring-[3px] ring-white sm:size-20", dish.className)}
                >
                  <Image src={images[dish.key].src} alt="" fill sizes="80px" className="object-cover" />
                </li>
              ))}
            </ul>
            <HalalBadge compact className="ml-auto size-16 drop-shadow-[0_8px_14px_rgba(6,19,46,0.3)] sm:size-20" />
          </div>
        </div>

        <div className="relative hidden h-[400px] w-[460px] lg:block">
          {CLUSTER.map((dish) => (
            <div
              key={dish.key}
              aria-hidden="true"
              className={cn("absolute rounded-full bg-white p-[5px] shadow-[0_24px_48px_-24px_rgba(6,19,46,0.55)] ring-[3px] ring-nazar", dish.className)}
            >
              <div className="relative size-full overflow-hidden rounded-full">
                <Image src={images[dish.key].src} alt="" fill sizes={`${dish.px}px`} className="object-cover" />
              </div>
            </div>
          ))}
          <HalalBadge className="absolute top-0 left-0 size-28 drop-shadow-[0_14px_22px_rgba(6,19,46,0.3)]" />
          {/* La perle bleue du logo, en clin d'œil. */}
          <Nazar className="absolute top-[336px] left-[180px] size-14 drop-shadow-[0_8px_14px_rgba(6,19,46,0.3)]" />
        </div>
      </div>
    </div>
  );
}

/** Perle nazar (œil bleu) du logo. */
function Nazar({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" className={className}>
      <circle cx="50" cy="50" r="50" fill="#0140b8" />
      <circle cx="50" cy="50" r="35" fill="#fff" />
      <circle cx="50" cy="50" r="25" fill="#8cc8f2" />
      <circle cx="50" cy="50" r="12" fill="#06132e" />
      <ellipse cx="34" cy="28" rx="12" ry="7" fill="#fff" opacity="0.35" transform="rotate(-35 34 28)" />
    </svg>
  );
}
