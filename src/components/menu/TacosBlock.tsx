import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { images } from "@/data/images";
import type { tacos as TacosData } from "@/data/menu";
import { formatPrice, spokenPrice } from "@/data/menu";
import { TACOS_PRODUCT_ID } from "@/features/order/catalog";
import { PriceBadge } from "@/components/ui/PriceBadge";
import { OrderButton } from "@/components/order/OrderButton";

export function TacosBlock({ tacos }: { tacos: typeof TacosData }) {
  const photo = images["tacos"];
  return (
    <div className="grid gap-10 py-6 md:grid-cols-[1fr_1.2fr]">
      <div>
        <div className="relative mb-8 aspect-[16/10] overflow-hidden rounded-[22px] bg-paper">
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            placeholder="blur"
            sizes="(min-width: 768px) 45vw, 100vw"
            className="object-cover"
          />
        </div>
        <h3 className="text-lg font-semibold text-night">Formules</h3>
        <ul className="mt-4 flex flex-wrap gap-6">
          {tacos.formulas.map((f) => (
            <li key={f.label} className="flex flex-col items-center gap-2">
              <PriceBadge cents={f.price} size="lg" />
              <span className="text-[15px] font-medium text-slate">{f.label}</span>
            </li>
          ))}
        </ul>
        <OrderButton productId={TACOS_PRODUCT_ID} className="mt-8 w-full sm:w-auto">
          Composer mon tacos
          <ArrowRight className="size-[18px]" aria-hidden="true" />
        </OrderButton>
      </div>
      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-semibold text-night">Viandes au choix</h3>
          <ul className="mt-3 flex flex-wrap gap-2">
            {tacos.meats.map((meat) => (
              <li key={meat} className="rounded-full border border-line bg-mist px-3.5 py-1.5 text-[15px] text-night">
                {meat}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-night">Suppléments</h3>
          <ul className="mt-3 divide-y divide-line">
            {tacos.supplements.map((s) => (
              <li key={s.label} className="flex justify-between py-2.5 text-[15px] text-slate">
                <span>{s.label}</span>
                <span className="font-semibold text-night tabular-nums">
                  <span aria-hidden="true">+{formatPrice(s.price)}</span>
                  <span className="sr-only">plus {spokenPrice(s.price)}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
