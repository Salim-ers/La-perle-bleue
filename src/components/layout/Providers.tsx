"use client";

import { LazyMotion, MotionConfig } from "framer-motion";
import type { ReactNode } from "react";
import { CartHydrator } from "@/components/cart/CartHydrator";

// Les fonctionnalités d'animation sont chargées après le rendu initial.
const loadFeatures = () => import("./motion-features").then((m) => m.default);

export function Providers({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user">
        <CartHydrator />
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}
