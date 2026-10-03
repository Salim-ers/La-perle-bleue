"use client";

import Image from "next/image";
import { m } from "framer-motion";
import { AlertTriangle, Check, X } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { images } from "@/data/images";
import { formatPrice, spokenPrice } from "@/data/menu";
import { orderingSettings } from "@/data/ordering";
import { useCartStore } from "@/features/cart/store";
import { useOrderUI } from "@/features/cart/ui";
import { useLiveStore, useOrderingState } from "@/features/live/store";
import { getProduct, withAvailability } from "@/features/order/catalog";
import {
  calculateConfiguredProductPrice,
  getDefaultSelection,
  getGroupLimits,
  groupHint,
  isSingleChoice,
  normalizeSelection,
  visibleGroups,
} from "@/features/order/pricing";
import { ALLERGENS, type OptionGroup, type Product, type Selection } from "@/features/order/types";
import { NOTE_MAX, validateSelection } from "@/features/order/validation";
import { formatDelta, formatEuros } from "@/lib/money";
import { cn } from "@/lib/utils";
import { buttonClasses } from "@/components/ui/Button";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { Sheet } from "@/components/ui/Sheet";

/**
 * Configurateur produit, monté une seule fois dans le layout.
 * Ouvert par startOrder(productId) ou editCartLine(lineId). Modale sur desktop,
 * panneau bas d'écran sur mobile. Toutes les règles viennent du catalogue.
 */
export function ProductConfigurator() {
  const productId = useOrderUI((s) => s.configuratorProductId);
  const editingLineId = useOrderUI((s) => s.editingLineId);
  const close = useOrderUI((s) => s.closeConfigurator);
  const live = useLiveStore((s) => s.live);
  const base = productId ? getProduct(productId) : null;
  const product = useMemo(() => (base ? withAvailability(base, live) : null), [base, live]);
  // Garde le contenu à l'écran pendant l'animation de fermeture.
  const [shown, setShown] = useState<{ product: Product; lineId: string | null } | null>(null);
  if (product && (product !== shown?.product || editingLineId !== shown?.lineId)) setShown({ product, lineId: editingLineId });
  const display = product ? { product, lineId: editingLineId } : shown;

  return (
    <Sheet open={!!product} onClose={close} labelledBy="configurateur-titre" className={display?.product.image ? "md:max-w-[680px] lg:max-w-[940px]" : "md:max-w-[620px]"}>
      {display && (
        <Configurator key={`${display.product.id}:${display.lineId ?? "new"}`} product={display.product} lineId={display.lineId} onClose={close} />
      )}
    </Sheet>
  );
}

function Configurator({ product, lineId, onClose }: { product: Product; lineId: string | null; onClose: () => void }) {
  const uid = useId();
  const editing = useCartStore((s) => (lineId ? s.items.find((i) => i.lineId === lineId) : undefined));
  const [selection, setSelection] = useState<Selection>(() =>
    editing ? normalizeSelection(product, editing.options) : getDefaultSelection(product),
  );
  const [quantity, setQuantity] = useState(editing?.quantity ?? 1);
  const [note, setNote] = useState(editing?.note ?? "");
  const [showErrors, setShowErrors] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const updateItem = useCartStore((s) => s.updateItem);
  const notify = useOrderUI((s) => s.notify);
  const ordering = useOrderingState();

  const errors = useMemo(() => validateSelection(product, selection), [product, selection]);
  const { total } = calculateConfiguredProductPrice(product, selection, quantity);
  const img = product.image ? images[product.image] : null;
  const groups = visibleGroups(product, selection);

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
      // Groupes dépendants recalculés (boisson du menu, frites à part, nombre de viandes…).
      return normalizeSelection(product, { ...prev, [group.id]: ids });
    });

  const submit = () => {
    if (!ordering.canOrder || !product.available) return;
    const firstInvalid = product.optionGroups.find((g) => errors[g.id]);
    if (firstInvalid) {
      setShowErrors(true);
      const el = document.getElementById(`${uid}-${firstInvalid.id}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.querySelector<HTMLElement>("input:not([disabled])")?.focus({ preventScroll: true });
      return;
    }
    const item = { productId: product.id, options: selection, quantity, note: note.trim() || undefined };
    if (lineId) {
      updateItem(lineId, item);
      notify(`Article modifié : ${product.name}`);
    } else {
      addItem(item);
      notify(`Ajouté au panier : ${quantity > 1 ? `${quantity} × ` : ""}${product.name}`);
    }
    onClose();
  };

  const blocked = !ordering.canOrder ? ordering.message : !product.available ? "Produit momentanément indisponible" : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
      {img && (
        <div className="relative hidden lg:block lg:w-[42%] lg:shrink-0">
          <Image src={img.src} alt={img.alt} fill placeholder="blur" sizes="400px" className="object-cover" />
        </div>
      )}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {/* En-tête fixe */}
        <div className="flex items-start justify-between gap-3 border-b border-line bg-white px-5 pt-6 pb-3 md:px-8 md:pt-7">
          <div className="min-w-0">
            <h2 id="configurateur-titre" className="display text-[2.1rem] text-deep md:text-[2.6rem]">
              {product.name}
            </h2>
            <p className="mt-0.5 font-display text-xl font-extrabold text-night tabular-nums">
              <span aria-hidden="true">{formatPrice(product.basePrice)}</span>
              <span className="sr-only">{spokenPrice(product.basePrice)}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="-mr-2 grid size-11 shrink-0 place-items-center rounded-full text-night transition-colors hover:bg-night/6"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        {/* Un seul défilement */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {img && (
            <div className="relative aspect-[2/1] sm:aspect-[16/9] lg:hidden">
              <Image src={img.src} alt={img.alt} fill placeholder="blur" sizes="100vw" className="object-cover" />
            </div>
          )}
          <div className="px-5 pt-4 md:px-8">
            {product.description && <p className="text-[15px] leading-snug text-slate">{product.description}</p>}
            <Allergens product={product} />
          </div>

          <div className="px-5 pb-6 md:px-8">
            {groups.map((g) => (
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
                <span className="text-lg font-bold text-night">Instructions particulières</span>
                <span className="text-xs font-bold tracking-wide text-slate uppercase">Facultatif</span>
              </label>
              <p id={`${uid}-note-hint`} className="mt-0.5 text-sm text-slate">
                Les suppléments payants doivent être sélectionnés dans les options.
              </p>
              <textarea
                id={`${uid}-note`}
                aria-describedby={`${uid}-note-hint`}
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, NOTE_MAX))}
                maxLength={NOTE_MAX}
                rows={2}
                placeholder="Ex. : pas trop grillé, sauce à part…"
                className="mt-3 w-full resize-none rounded-2xl border border-line bg-cream px-4 py-3 text-base text-night placeholder:text-slate/70 focus:border-royal"
              />
              <p className="mt-1 text-right text-xs text-slate tabular-nums">
                {note.length}/{NOTE_MAX}
              </p>
            </div>
          </div>
        </div>

        {/* Pied fixe */}
        <div className="border-t border-line bg-white px-5 py-3.5 md:px-8 md:py-4">
          {blocked && (
            <p role="status" className="mb-3 flex items-center gap-2 rounded-xl bg-sand/30 px-3 py-2 text-sm font-semibold text-night">
              <AlertTriangle className="size-4 shrink-0 text-ember" aria-hidden="true" />
              {blocked}
            </p>
          )}
          <div className="flex items-center gap-3">
            <QuantityStepper value={quantity} onChange={setQuantity} max={orderingSettings.maxQuantityPerItem} label={product.name} />
            <m.button
              type="button"
              onClick={submit}
              disabled={!!blocked}
              whileTap={{ scale: 0.97 }}
              className={buttonClasses({ size: "lg", className: "min-w-0 flex-1 px-4" })}
            >
              <span>
                {lineId ? "Mettre à jour" : "Ajouter"}
                {!lineId && <span className="hidden sm:inline"> au panier</span>}
              </span>
              <span aria-hidden="true">—</span>
              <span className="tabular-nums">{formatEuros(total)}</span>
            </m.button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Allergens({ product }: { product: Product }) {
  if (product.allergens === null) {
    return (
      <p className="mt-3 rounded-xl bg-paper px-3 py-2 text-[13px] leading-snug text-slate">
        <strong className="text-night">Allergènes :</strong> information en cours de validation par le restaurant.
        En cas d&apos;allergie, appelez-nous ou renseignez-vous au comptoir avant de commander.
      </p>
    );
  }
  return (
    <p className="mt-3 rounded-xl bg-paper px-3 py-2 text-[13px] leading-snug text-slate">
      <strong className="text-night">Allergènes :</strong>{" "}
      {product.allergens.length ? product.allergens.map((a) => ALLERGENS[a]).join(", ") : "aucun des 14 allergènes réglementaires"}
    </p>
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
          {!single && max > 1 && ids.length > 0 && <span className="font-semibold text-night"> · {ids.length}/{max}</span>}
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
          const unavailable = o.available === false;
          const disabled = (unavailable && !checked) || (!checked && full);
          // Sauce au-delà des incluses : le supplément s'affiche sur les cases restantes.
          const extra = group.included !== undefined && group.extraPriceDelta && !checked && ids.length >= group.included ? group.extraPriceDelta : 0;
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
                  {checked && (single ? <span className="size-2.5 rounded-full bg-white" /> : <Check className="size-4" strokeWidth={3} />)}
                </span>
                <span className="flex-1 text-base font-medium text-night">{o.name}</span>
                {unavailable ? (
                  <span className="rounded-full bg-night/6 px-2 py-0.5 text-xs font-bold tracking-wide text-slate uppercase">Rupture</span>
                ) : o.priceDelta + extra ? (
                  <span className="text-[15px] font-semibold text-royal tabular-nums">{formatDelta(o.priceDelta + extra)}</span>
                ) : null}
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
