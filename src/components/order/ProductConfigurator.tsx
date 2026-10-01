"use client";

import Image from "next/image";
import { m } from "framer-motion";
import { Check, X } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { images } from "@/data/images";
import { formatPrice, spokenPrice } from "@/data/menu";
import { orderingSettings } from "@/data/ordering";
import { useCartStore } from "@/features/cart/store";
import { useOrderUI } from "@/features/cart/ui";
import { getProduct } from "@/features/order/catalog";
import {
  calculateItemPrice,
  getDefaultSelection,
  getGroupLimits,
  groupHint,
  isSingleChoice,
} from "@/features/order/pricing";
import type { OptionGroup, Product, Selection } from "@/features/order/types";
import { validateSelection } from "@/features/order/validation";
import { formatDelta, formatEuros } from "@/lib/money";
import { cn } from "@/lib/utils";
import { buttonClasses } from "@/components/ui/Button";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { Sheet } from "@/components/ui/Sheet";

/**
 * Configurateur produit, monté une seule fois dans le layout et ouvert par
 * startOrder(productId). Modale sur desktop, panneau bas d'écran sur mobile.
 * Les groupes d'options viennent du catalogue : aucun code propre à un produit.
 */
export function ProductConfigurator() {
  const productId = useOrderUI((s) => s.configuratorProductId);
  const close = useOrderUI((s) => s.closeConfigurator);
  const product = productId ? getProduct(productId) : null;
  // Garde le contenu à l'écran pendant l'animation de fermeture.
  const [shown, setShown] = useState<Product | null>(null);
  if (product && product !== shown) setShown(product);
  const display = product ?? shown;

  return (
    <Sheet
      open={!!product}
      onClose={close}
      labelledBy="configurateur-titre"
      className={display?.image ? undefined : "md:max-w-[620px]"}
    >
      {display && <Configurator key={display.id} product={display} onClose={close} />}
    </Sheet>
  );
}

function Configurator({ product, onClose }: { product: Product; onClose: () => void }) {
  const uid = useId();
  const [selection, setSelection] = useState<Selection>(() => getDefaultSelection(product));
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  const [showErrors, setShowErrors] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const notify = useOrderUI((s) => s.notify);

  const errors = useMemo(() => validateSelection(product, selection), [product, selection]);
  const { total } = calculateItemPrice(product, selection, quantity);
  const img = product.image ? images[product.image] : null;

  const toggle = (group: OptionGroup, optionId: string) =>
    setSelection((prev) => {
      const current = prev[group.id] ?? [];
      const { max } = getGroupLimits(group, prev);
      let ids: string[];
      if (isSingleChoice(group)) ids = [optionId];
      else if (current.includes(optionId)) ids = current.filter((id) => id !== optionId);
      else if (max === 1) ids = [optionId];
      else if (current.length >= max) return prev;
      else ids = [...current, optionId];
      const next = { ...prev, [group.id]: ids };
      // Groupes dépendants (tacos : viandes selon la taille) ramenés à leur nouveau maximum.
      for (const g of product.optionGroups) {
        if (g.limitsFrom?.groupId === group.id) {
          next[g.id] = (next[g.id] ?? []).slice(0, getGroupLimits(g, next).max);
        }
      }
      return next;
    });

  const submit = () => {
    const firstInvalid = product.optionGroups.find((g) => errors[g.id]);
    if (firstInvalid) {
      setShowErrors(true);
      const el = document.getElementById(`${uid}-${firstInvalid.id}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.querySelector<HTMLElement>("input:not([disabled])")?.focus({ preventScroll: true });
      return;
    }
    addItem({ productId: product.id, options: selection, quantity, note: note.trim() || undefined });
    notify(`Ajouté au panier : ${quantity > 1 ? `${quantity} × ` : ""}${product.name}`);
    onClose();
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col md:flex-row">
      {img && (
        <div className="relative hidden md:block md:w-[42%] md:shrink-0">
          <Image src={img.src} alt={img.alt} fill placeholder="blur" sizes="400px" className="object-cover" />
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="absolute top-3 right-3 z-20 grid size-11 place-items-center rounded-full bg-white/90 text-night shadow-sm backdrop-blur transition-colors hover:bg-white"
        >
          <X className="size-5" aria-hidden="true" />
        </button>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {/* Fondu sous le bouton Fermer quand le contenu défile (sauf sur la photo mobile). */}
          <div
            aria-hidden="true"
            className={cn(
              "pointer-events-none sticky top-0 z-10 -mb-14 h-14 bg-gradient-to-b from-white via-white/85 to-white/0",
              img && "hidden md:block",
            )}
          />
          {img && (
            <div className="relative aspect-[16/10] md:hidden">
              <Image src={img.src} alt={img.alt} fill placeholder="blur" sizes="100vw" className="object-cover" />
            </div>
          )}

          <div className={cn("px-5 md:px-8", img ? "pt-5 md:pt-9" : "pt-9")}>
            <h2 id="configurateur-titre" className="display pr-12 text-[2.6rem] text-deep md:text-5xl">
              {product.name}
            </h2>
            {product.description && <p className="mt-2 text-[15px] leading-snug text-slate">{product.description}</p>}
            <p className="mt-3 font-display text-[26px] font-extrabold text-night tabular-nums">
              <span aria-hidden="true">{formatPrice(product.basePrice)}</span>
              <span className="sr-only">{spokenPrice(product.basePrice)}</span>
            </p>
          </div>

          <div className="px-5 pb-6 md:px-8">
            {product.optionGroups.map((g) => (
              <OptionGroupField
                key={g.id}
                uid={uid}
                group={g}
                selection={selection}
                error={showErrors ? errors[g.id] : undefined}
                onToggle={toggle}
              />
            ))}

            <div className="mt-2 border-t border-line pt-5">
              <label htmlFor={`${uid}-note`} className="flex items-baseline justify-between gap-3">
                <span className="text-lg font-bold text-night">Une précision&nbsp;?</span>
                <span className="text-xs font-bold tracking-wide text-slate uppercase">Facultatif</span>
              </label>
              <textarea
                id={`${uid}-note`}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={140}
                rows={2}
                placeholder="Ex. : bien cuit, sauce à part…"
                className="mt-3 w-full resize-none rounded-2xl border border-line bg-cream px-4 py-3 text-base text-night placeholder:text-slate/70 focus:border-royal"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 border-t border-line bg-white px-5 py-4 md:px-8">
          <QuantityStepper
            value={quantity}
            onChange={setQuantity}
            max={orderingSettings.maxQuantityPerItem}
            label={product.name}
          />
          <m.button
            type="button"
            onClick={submit}
            whileTap={{ scale: 0.97 }}
            className={buttonClasses({ size: "lg", className: "min-w-0 flex-1 px-4" })}
          >
            <span>
              Ajouter<span className="hidden sm:inline"> au panier</span>
            </span>
            <span aria-hidden="true">—</span>
            <span className="tabular-nums">{formatEuros(total)}</span>
          </m.button>
        </div>
      </div>
    </div>
  );
}

function OptionGroupField({
  uid,
  group,
  selection,
  error,
  onToggle,
}: {
  uid: string;
  group: OptionGroup;
  selection: Selection;
  error?: string;
  onToggle: (group: OptionGroup, optionId: string) => void;
}) {
  const ids = selection[group.id] ?? [];
  const { min, max } = getGroupLimits(group, selection);
  const single = isSingleChoice(group);
  const full = !single && max > 1 && ids.length >= max;
  const required = group.required || min > 0;
  const hint = groupHint(group, selection);
  const base = `${uid}-${group.id}`;

  return (
    <div
      id={base}
      role={single ? "radiogroup" : "group"}
      aria-labelledby={`${base}-title`}
      aria-describedby={cn(hint && `${base}-hint`, error && `${base}-error`) || undefined}
      className="scroll-mt-6 border-t border-line pt-5 pb-3 first:border-t-0"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h3 id={`${base}-title`} className="text-lg font-bold text-night">
          {group.name}
        </h3>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-1 text-xs font-bold tracking-wide uppercase",
            required ? "bg-royal/10 text-royal" : "text-slate",
          )}
        >
          {required ? "Obligatoire" : "Facultatif"}
        </span>
      </div>
      {hint && (
        <p id={`${base}-hint`} className="mt-0.5 text-sm text-slate">
          {hint}
          {!single && max > 1 && ids.length > 0 && (
            <span className="font-semibold text-night">
              {" "}
              · {ids.length}/{max}
            </span>
          )}
        </p>
      )}
      {error && (
        <p id={`${base}-error`} role="alert" className="mt-1.5 text-sm font-semibold text-[#b42318]">
          {error}
        </p>
      )}

      <ul className="mt-2">
        {group.options.map((o) => {
          const checked = ids.includes(o.id);
          const disabled = o.available === false || (!checked && full);
          return (
            <li key={o.id}>
              <label
                className={cn(
                  "-mx-3 flex min-h-[52px] cursor-pointer items-center gap-3 rounded-xl px-3 transition-colors hover:bg-cream",
                  "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-royal",
                  disabled && "cursor-not-allowed opacity-45 hover:bg-transparent",
                )}
              >
                <input
                  type={single ? "radio" : "checkbox"}
                  name={base}
                  value={o.id}
                  checked={checked}
                  disabled={disabled}
                  onChange={() => onToggle(group, o.id)}
                  className="sr-only"
                />
                <span
                  aria-hidden="true"
                  className={cn(
                    "grid size-6 shrink-0 place-items-center border-2 transition-colors duration-200",
                    single ? "rounded-full" : "rounded-[7px]",
                    checked ? "border-royal bg-royal text-white" : "border-night/25 bg-white",
                  )}
                >
                  {checked &&
                    (single ? (
                      <span className="size-2.5 rounded-full bg-white" />
                    ) : (
                      <Check className="size-4" strokeWidth={3} />
                    ))}
                </span>
                <span className="flex-1 text-base font-medium text-night">{o.name}</span>
                {o.available === false ? (
                  <span className="text-sm text-slate">Indisponible</span>
                ) : o.priceDelta ? (
                  <span className="text-[15px] font-semibold text-royal tabular-nums">{formatDelta(o.priceDelta)}</span>
                ) : null}
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
