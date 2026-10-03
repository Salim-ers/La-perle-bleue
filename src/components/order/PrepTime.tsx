"use client";

import { useOrderingState } from "@/features/live/store";

/** Délai de préparation en direct (réglé dans l'admin), ex. « 20 min ». */
export function PrepTime() {
  const { preparationDelay } = useOrderingState();
  return <>{preparationDelay}&nbsp;min</>;
}
