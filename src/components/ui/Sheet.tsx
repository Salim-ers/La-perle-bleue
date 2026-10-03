"use client";

import { AnimatePresence, m, useDragControls, type PanInfo } from "framer-motion";
import { useEffect, useRef, useSyncExternalStore, type ReactNode, type RefObject } from "react";
import { lockScroll } from "@/lib/scroll-lock";
import { cn } from "@/lib/utils";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
const DESKTOP = "(min-width: 768px)";

function useIsDesktop() {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(DESKTOP);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(DESKTOP).matches,
    () => false,
  );
}

interface SheetProps {
  open: boolean;
  onClose: () => void;
  /** id du titre affiché dans le panneau. */
  labelledBy: string;
  /** Desktop : "modal" centrée ou "drawer" à droite. Mobile : toujours un panneau en bas d'écran. */
  variant?: "modal" | "drawer";
  /** Élément focalisé à l'ouverture (sinon le premier `[data-autofocus]`, sinon le panneau). */
  initialFocus?: RefObject<HTMLElement | null>;
  className?: string;
  children: ReactNode;
}

/** Panneau accessible : focus piégé, Échap, clic extérieur, glisser vers le bas pour fermer (mobile). */
export function Sheet({ open, ...props }: SheetProps) {
  return <AnimatePresence>{open && <SheetPanel {...props} />}</AnimatePresence>;
}

function SheetPanel({ onClose, labelledBy, variant = "modal", initialFocus, className, children }: Omit<SheetProps, "open">) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const isDesktop = useIsDesktop();
  const drag = useDragControls();

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const previous = document.activeElement as HTMLElement | null;
    const unlock = lockScroll();
    (initialFocus?.current ?? panel.querySelector<HTMLElement>("[data-autofocus]") ?? panel).focus({
      preventScroll: true,
    });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab") return;
      const nodes = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.getClientRects().length > 0,
      );
      if (nodes.length === 0) {
        e.preventDefault();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === panel || !panel.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !panel.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      unlock();
      // Rend le focus au bouton d'origine, sauf si un autre panneau l'a déjà pris.
      const active = document.activeElement;
      if (!active || active === document.body || panel.contains(active)) previous?.focus({ preventScroll: true });
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 110 || info.velocity.y > 600) onClose();
  };

  const motionProps = !isDesktop
    ? {
        initial: { y: "100%" },
        animate: { y: 0 },
        exit: { y: "100%" },
        transition: { type: "spring" as const, stiffness: 380, damping: 40 },
        drag: "y" as const,
        dragListener: false,
        dragControls: drag,
        dragConstraints: { top: 0, bottom: 0 },
        dragElastic: { top: 0, bottom: 0.55 },
        onDragEnd,
      }
    : variant === "drawer"
      ? {
          initial: { x: "100%" },
          animate: { x: 0 },
          exit: { x: "100%" },
          transition: { type: "spring" as const, stiffness: 340, damping: 38 },
        }
      : {
          initial: { opacity: 0, y: 28, scale: 0.97 },
          animate: { opacity: 1, y: 0, scale: 1 },
          exit: { opacity: 0, y: 20, scale: 0.98 },
          transition: { type: "spring" as const, stiffness: 360, damping: 34 },
        };

  return (
    <div
      className={cn(
        "fixed inset-0 z-[60] flex items-end",
        isDesktop && (variant === "drawer" ? "justify-end" : "items-center justify-center p-6"),
      )}
    >
      <m.div
        aria-hidden="true"
        className="absolute inset-0 bg-night/55 backdrop-blur-[3px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={onClose}
      />
      <m.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        {...motionProps}
        className={cn(
          "relative flex w-full flex-col overflow-hidden bg-white text-night outline-none",
          "shadow-[0_-20px_60px_-24px_rgba(6,19,46,0.55)]",
          !isDesktop && "max-h-[95dvh] rounded-t-[26px] pb-[env(safe-area-inset-bottom)]",
          isDesktop && variant === "drawer" && "h-full max-w-[460px]",
          isDesktop && variant === "modal" && "max-h-[min(88vh,860px)] max-w-[940px] rounded-[26px]",
          className,
        )}
      >
        {!isDesktop && (
          <div
            aria-hidden="true"
            onPointerDown={(e) => drag.start(e)}
            className="absolute inset-x-0 top-0 z-10 flex h-6 cursor-grab touch-none justify-center pt-2.5"
          >
            <span className="h-1.5 w-11 rounded-full bg-night/20" />
          </div>
        )}
        {children}
      </m.div>
    </div>
  );
}
