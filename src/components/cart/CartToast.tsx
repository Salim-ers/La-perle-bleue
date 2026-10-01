"use client";

import { AnimatePresence, m } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { useEffect } from "react";
import { useOrderUI } from "@/features/cart/ui";

/** Confirmation discrète après un ajout au panier. */
export function CartToast() {
  const toast = useOrderUI((s) => s.toast);
  const dismiss = useOrderUI((s) => s.dismissToast);
  const openCart = useOrderUI((s) => s.openCart);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(dismiss, 3200);
    return () => window.clearTimeout(id);
  }, [toast, dismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-3 top-[calc(var(--header-h)+10px)] z-[55] flex justify-center sm:inset-x-auto sm:right-6 sm:justify-end"
    >
      <AnimatePresence>
        {toast && (
          <m.div
            key={toast.id}
            initial={{ opacity: 0, y: -14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
            className="pointer-events-auto flex items-center gap-3 rounded-full bg-night py-2 pr-2 pl-4 text-white shadow-[0_18px_40px_-16px_rgba(6,19,46,0.7)]"
          >
            <CheckCircle2 className="size-5 shrink-0 text-nazar" aria-hidden="true" />
            <p className="text-[15px] font-medium">{toast.message}</p>
            <button
              type="button"
              onClick={() => {
                dismiss();
                openCart();
              }}
              className="on-dark min-h-10 shrink-0 rounded-full bg-white/12 px-4 text-[13px] font-bold tracking-[0.06em] uppercase transition-colors hover:bg-white/20"
            >
              Voir
            </button>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
