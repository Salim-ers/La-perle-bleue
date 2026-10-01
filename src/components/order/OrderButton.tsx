"use client";

import type { ReactNode } from "react";
import { startOrder } from "@/features/cart/ui";
import { buttonClasses } from "@/components/ui/Button";

/** Bouton texte qui lance la commande d'un produit (ex. « Composer mon tacos »). */
export function OrderButton({
  productId,
  children,
  className,
}: {
  productId: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button type="button" onClick={() => startOrder(productId)} className={buttonClasses({ size: "lg", className })}>
      {children}
    </button>
  );
}
