"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MenuCategory, MenuProduct, tacos as TacosData } from "@/data/menu";
import { MenuItem } from "./MenuItem";
import { ProductModal } from "./ProductModal";
import { TacosBlock } from "./TacosBlock";
import { cn } from "@/lib/utils";

/** Carte complète : barre de catégories collante (scroll horizontal sur mobile) + suivi de section. */
export function MenuBrowser({
  categories,
  products,
  tacos,
}: {
  categories: MenuCategory[];
  products: MenuProduct[];
  tacos: typeof TacosData;
}) {
  const visible = useMemo(
    () => categories.filter((c) => c.id === "tacos" || products.some((p) => p.categoryId === c.id)),
    [categories, products],
  );
  const [active, setActive] = useState(visible[0]?.id);
  const [selected, setSelected] = useState<MenuProduct | null>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setSelected(null), []);

  // Catégorie active : la dernière dont le titre est passé sous la barre (la dernière en bas de page, même courte).
  useEffect(() => {
    const sections = visible
      .map((c) => document.getElementById(`cat-${c.id}`))
      .filter(Boolean) as HTMLElement[];
    let frame = 0;
    const update = () => {
      frame = 0;
      let current = sections[0];
      for (const s of sections) if (s.getBoundingClientRect().top <= 170) current = s;
      const root = document.documentElement;
      if (window.innerHeight + window.scrollY >= root.scrollHeight - 4) current = sections[sections.length - 1];
      if (current) setActive(current.id.replace("cat-", "") as MenuCategory["id"]);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [visible]);

  // Garde l'onglet actif visible dans la barre horizontale
  useEffect(() => {
    const bar = barRef.current;
    const el = bar?.querySelector<HTMLElement>(`[data-cat="${active}"]`);
    if (bar && el) {
      bar.scrollTo({ left: el.offsetLeft - 20, behavior: "smooth" });
    }
  }, [active]);

  return (
    <>
      <div className="sticky top-[var(--header-h)] z-30 border-b border-line bg-white/92 backdrop-blur-md">
        <div ref={barRef} className="no-scrollbar container-x flex gap-2 overflow-x-auto py-3">
          {visible.map((c) => (
            <a
              key={c.id}
              data-cat={c.id}
              href={`#cat-${c.id}`}
              aria-current={active === c.id ? "true" : undefined}
              className={cn(
                "shrink-0 rounded-full px-4 py-2.5 text-[15px] font-semibold transition-colors",
                active === c.id ? "bg-deep text-white" : "bg-mist text-night hover:bg-line",
              )}
            >
              {c.name}
            </a>
          ))}
        </div>
      </div>

      <div className="container-x pb-24">
        {visible.map((c) => {
          const items = products.filter((p) => p.categoryId === c.id);
          return (
            <section
              key={c.id}
              id={`cat-${c.id}`}
              aria-labelledby={`cat-${c.id}-title`}
              className="scroll-mt-[150px] pt-16"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b-2 border-deep pb-3">
                <h2 id={`cat-${c.id}-title`} className="display text-5xl text-deep lg:text-6xl">
                  {c.name}
                </h2>
                {c.note && <p className="text-[15px] text-slate">{c.note}</p>}
              </div>
              {c.id === "tacos" ? (
                <TacosBlock tacos={tacos} />
              ) : (
                <ul className="grid gap-x-14 md:grid-cols-2">
                  {items.map((p) => (
                    <MenuItem key={p.id} product={p} onOpen={setSelected} orderable />
                  ))}
                </ul>
              )}
            </section>
          );
        })}
        <p className="mt-14 text-sm text-slate">
          Prix en euros, tels qu&apos;affichés au restaurant. Pour toute question sur les
          allergènes, renseignez-vous au comptoir. Photos non contractuelles.
        </p>
      </div>

      <ProductModal product={selected} onClose={close} />
    </>
  );
}
