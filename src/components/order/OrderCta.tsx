"use client";

import { ArrowRight, PauseCircle } from "lucide-react";
import type { ReactNode } from "react";
import { useOrderingState } from "@/features/live/store";
import { cn } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/Button";

/**
 * Bouton COMMANDER du site. Si le restaurant suspend les commandes (admin),
 * il affiche « Commandes temporairement suspendues » au lieu du lien.
 */
export function OrderCta({
  children = "Commander",
  size = "md",
  className,
  arrow = false,
  tone = "light",
  short = false,
}: {
  children?: ReactNode;
  size?: "md" | "lg";
  className?: string;
  arrow?: boolean;
  /** Fond sur lequel le bouton est posé (style de l'état suspendu). */
  tone?: "light" | "dark";
  /** Libellé court pour les petits emplacements (header). */
  short?: boolean;
}) {
  const { canOrder, message } = useOrderingState();
  if (!canOrder && message) {
    return (
      <span
        role="status"
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-full border-[1.5px] border-dashed px-5 text-center font-bold tracking-[0.04em] uppercase",
          size === "lg" ? "min-h-14 text-[13px]" : "min-h-12 text-[12px]",
          tone === "dark" ? "border-white/40 text-white/85" : "border-night/25 text-slate",
          className,
        )}
      >
        <PauseCircle className="size-4 shrink-0" aria-hidden="true" />
        {short ? "Commandes suspendues" : message}
      </span>
    );
  }
  return (
    <ButtonLink href="/menu" size={size} className={className}>
      {children}
      {arrow && <ArrowRight className="size-[18px] transition-transform group-hover:translate-x-0.5" aria-hidden="true" />}
    </ButtonLink>
  );
}
