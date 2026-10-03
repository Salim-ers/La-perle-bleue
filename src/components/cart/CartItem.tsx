"use client";

import Image from "next/image";
import { AlertTriangle, Pencil, Trash2, UtensilsCrossed } from "lucide-react";
import { images } from "@/data/images";
import { orderingSettings } from "@/data/ordering";
import { useCartStore, type CartLine } from "@/features/cart/store";
import { editCartLine } from "@/features/cart/ui";
import { formatEuros } from "@/lib/money";
import { QuantityStepper } from "@/components/ui/QuantityStepper";

export function CartItem({ line }: { line: CartLine }) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const img = line.product.image ? images[line.product.image] : null;
  const editable = line.product.optionGroups.length > 0;

  return (
    <div className="flex gap-4 py-5">
      <div className="relative size-[72px] shrink-0 overflow-hidden rounded-2xl bg-paper">
        {img ? (
          <Image src={img.src} alt="" fill sizes="72px" className="object-cover" />
        ) : (
          <UtensilsCrossed className="absolute inset-0 m-auto size-6 text-royal/60" aria-hidden="true" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-[16px] leading-snug font-bold text-night uppercase">{line.product.name}</h3>
          <p className="shrink-0 font-bold text-night tabular-nums">{formatEuros(line.total)}</p>
        </div>
        {line.summary.length > 0 && (
          <ul className="mt-1 space-y-0.5 text-sm leading-snug text-slate">
            {line.summary.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        )}
        {line.note && <p className="mt-1 text-sm text-slate italic">« {line.note} »</p>}
        {line.unavailable && (
          <p role="status" className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-[#b42318]">
            <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
            Indisponible : modifiez ou supprimez cet article.
          </p>
        )}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <QuantityStepper
            size="sm"
            value={line.quantity}
            onChange={(q) => updateQuantity(line.lineId, q)}
            max={orderingSettings.maxQuantityPerItem}
            label={line.product.name}
          />
          <div className="flex items-center">
            {editable && (
              <button
                type="button"
                onClick={() => editCartLine(line.lineId)}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-bold text-royal transition-colors hover:bg-royal/8"
              >
                <Pencil className="size-4" aria-hidden="true" />
                Modifier<span className="sr-only"> : {line.product.name}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => removeItem(line.lineId)}
              aria-label={`Supprimer : ${line.product.name}`}
              className="grid size-11 place-items-center rounded-full text-slate transition-colors hover:bg-night/5 hover:text-night"
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
