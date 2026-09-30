"use client";

import { useCallback, useId, useState } from "react";
import type { MenuCategory, MenuProduct, tacos as TacosData } from "@/data/menu";
import { MenuItem } from "@/components/menu/MenuItem";
import { ProductModal } from "@/components/menu/ProductModal";
import { TacosBlock } from "@/components/menu/TacosBlock";
import { ButtonLink } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const PREVIEW: MenuCategory["id"][] = ["assiettes", "sandwichs", "tacos", "burgers"];

export function MenuPreview({
  categories,
  products,
  tacos,
}: {
  categories: MenuCategory[];
  products: MenuProduct[];
  tacos: typeof TacosData;
}) {
  const tabs = categories.filter((c) => PREVIEW.includes(c.id));
  const [active, setActive] = useState(tabs[0].id);
  const [selected, setSelected] = useState<MenuProduct | null>(null);
  const close = useCallback(() => setSelected(null), []);
  const uid = useId();
  const current = tabs.find((t) => t.id === active)!;
  const items = products.filter((p) => p.categoryId === active).slice(0, 8);

  const onKey = (e: React.KeyboardEvent, i: number) => {
    const dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!dir) return;
    const next = tabs[(i + dir + tabs.length) % tabs.length];
    setActive(next.id);
    document.getElementById(`${uid}-tab-${next.id}`)?.focus();
  };

  return (
    <section aria-labelledby="carte-title" className="bg-white py-20 text-night lg:py-32">
      <div className="container-x">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h2 id="carte-title" className="display text-[clamp(2.8rem,6vw,4.6rem)] text-deep">
            Notre carte
          </h2>
          <ButtonLink href="/menu" variant="outline-dark">
            Voir toute la carte
          </ButtonLink>
        </div>

        <div
          role="tablist"
          aria-label="Catégories"
          className="no-scrollbar -mx-5 mt-10 flex gap-2 overflow-x-auto px-5 lg:mx-0 lg:px-0"
        >
          {tabs.map((t, i) => (
            <button
              key={t.id}
              id={`${uid}-tab-${t.id}`}
              role="tab"
              type="button"
              aria-selected={active === t.id}
              aria-controls={`${uid}-panel`}
              tabIndex={active === t.id ? 0 : -1}
              onClick={() => setActive(t.id)}
              onKeyDown={(e) => onKey(e, i)}
              className={cn(
                "shrink-0 rounded-full px-5 py-2.5 text-[15px] font-semibold transition-colors",
                active === t.id ? "bg-deep text-white" : "bg-mist text-night hover:bg-line",
              )}
            >
              {t.name}
            </button>
          ))}
        </div>

        <div
          id={`${uid}-panel`}
          role="tabpanel"
          aria-labelledby={`${uid}-tab-${active}`}
          className="mt-6"
        >
          {current.note && <p className="text-[15px] text-slate">{current.note}</p>}
          {active === "tacos" ? (
            <TacosBlock tacos={tacos} />
          ) : (
            <ul className="grid gap-x-14 md:grid-cols-2">
              {items.map((p) => (
                <MenuItem key={p.id} product={p} onOpen={setSelected} />
              ))}
            </ul>
          )}
        </div>
      </div>
      <ProductModal product={selected} onClose={close} />
    </section>
  );
}
