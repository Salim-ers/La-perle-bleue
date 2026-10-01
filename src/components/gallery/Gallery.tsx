"use client";

import Image from "next/image";
import { AnimatePresence, m, type PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { images, type ImageKey } from "@/data/images";
import { lockScroll } from "@/lib/scroll-lock";
import { cn } from "@/lib/utils";

/** Grille asymétrique (accueil) : 1 grande photo + 4, pensée pour 5 images. */
const FEATURE_CELLS = [
  "col-span-2 aspect-[4/3] md:col-span-7 md:row-span-2 md:aspect-auto",
  "aspect-[4/5] md:col-span-5 md:aspect-auto",
  "aspect-[4/5] md:col-span-5 md:aspect-auto",
  "aspect-[4/5] md:col-span-4 md:aspect-auto",
  "aspect-[4/5] md:col-span-8 md:aspect-auto",
];

export function Gallery({
  keys,
  className,
  layout = "masonry",
}: {
  keys: ImageKey[];
  className?: string;
  /** "masonry" : colonnes (page Galerie). "feature" : grille asymétrique (accueil). */
  layout?: "masonry" | "feature";
}) {
  const [index, setIndex] = useState<number | null>(null);
  const [dir, setDir] = useState(0);
  const closeRef = useRef<HTMLButtonElement>(null);
  const lastTrigger = useRef<HTMLElement | null>(null);

  const go = useCallback(
    (step: number) => {
      setDir(step);
      setIndex((i) => (i === null ? i : (i + step + keys.length) % keys.length));
    },
    [keys.length],
  );
  const close = useCallback(() => setIndex(null), []);

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    const unlock = lockScroll();
    return () => {
      window.removeEventListener("keydown", onKey);
      unlock();
    };
  }, [index, go, close]);

  useEffect(() => {
    if (index !== null) closeRef.current?.focus();
    else lastTrigger.current?.focus();
  }, [index === null]); // eslint-disable-line react-hooks/exhaustive-deps

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -60 || info.velocity.x < -400) go(1);
    else if (info.offset.x > 60 || info.velocity.x > 400) go(-1);
  };

  const current = index !== null ? images[keys[index]] : null;

  return (
    <>
      <ul
        className={cn(
          layout === "feature"
            ? "grid grid-cols-2 gap-3 md:auto-rows-[230px] md:grid-cols-12 md:gap-4 lg:auto-rows-[290px]"
            : "columns-1 gap-4 sm:columns-2 sm:gap-5",
          className,
        )}
      >
        {keys.map((k, i) => {
          const img = images[k];
          const feature = layout === "feature";
          return (
            <li
              key={k}
              className={cn(
                feature ? cn("relative", FEATURE_CELLS[i % FEATURE_CELLS.length]) : "mb-4 break-inside-avoid sm:mb-5",
              )}
            >
              <button
                type="button"
                onClick={(e) => {
                  lastTrigger.current = e.currentTarget;
                  setDir(0);
                  setIndex(i);
                }}
                className={cn(
                  "group relative block w-full overflow-hidden rounded-[18px] bg-line",
                  feature && "h-full",
                )}
                aria-label={`Agrandir : ${img.alt}`}
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  placeholder="blur"
                  {...(feature
                    ? { fill: true, sizes: i === 0 ? "(min-width: 768px) 58vw, 100vw" : "(min-width: 768px) 40vw, 50vw" }
                    : { sizes: "(min-width: 640px) 50vw, 100vw" })}
                  className={cn(
                    "transition-transform duration-700 ease-[var(--ease-soft)] group-hover:scale-[1.03]",
                    feature ? "object-cover" : "h-auto w-full",
                  )}
                />
                <span className="pointer-events-none absolute inset-0 bg-night/0 transition-colors duration-500 group-hover:bg-night/10" />
              </button>
            </li>
          );
        })}
      </ul>

      <AnimatePresence>
        {current && index !== null && (
          <m.div
            role="dialog"
            aria-modal="true"
            aria-label="Galerie photo"
            className="on-dark fixed inset-0 z-[60] flex flex-col bg-night text-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-2">
              <p className="text-sm text-fog tabular-nums" aria-live="polite">
                {index + 1} / {keys.length}
              </p>
              <button
                ref={closeRef}
                type="button"
                onClick={close}
                aria-label="Fermer la galerie"
                className="grid size-11 place-items-center rounded-full hover:bg-white/10"
              >
                <X className="size-6" />
              </button>
            </div>

            <div className="relative flex-1 overflow-hidden">
              <AnimatePresence initial={false} custom={dir} mode="popLayout">
                <m.div
                  key={keys[index]}
                  custom={dir}
                  className="absolute inset-0 flex touch-pan-y items-center justify-center px-4 sm:px-20"
                  initial={{ x: dir * 80, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: dir * -80, opacity: 0 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.6}
                  onDragEnd={onDragEnd}
                >
                  <Image
                    src={current.src}
                    alt={current.alt}
                    placeholder="blur"
                    sizes="100vw"
                    draggable={false}
                    className="max-h-full w-auto max-w-full rounded-[4px] object-contain select-none"
                    style={{ maxHeight: "calc(100svh - 150px)" }}
                  />
                </m.div>
              </AnimatePresence>
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Photo précédente"
                className="absolute top-1/2 left-3 hidden size-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 hover:bg-white/20 sm:grid"
              >
                <ChevronLeft className="size-6" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Photo suivante"
                className="absolute top-1/2 right-3 hidden size-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 hover:bg-white/20 sm:grid"
              >
                <ChevronRight className="size-6" />
              </button>
            </div>
            <p className="mx-auto max-w-2xl px-6 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-center text-[15px] text-fog">
              {current.alt}
              <span className="block pt-1 text-xs text-white/40 sm:hidden">Balayez pour naviguer</span>
            </p>
          </m.div>
        )}
      </AnimatePresence>
    </>
  );
}
