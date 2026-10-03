"use client";

import { KitchenApp } from "@/components/admin/KitchenApp";
import type { KitchenSource } from "@/components/admin/useKitchen";
import { demoKitchenAction, demoKitchenSnapshot } from "@/features/demo/store";

const demoSource: KitchenSource = {
  load: async () => demoKitchenSnapshot(),
  act: demoKitchenAction,
};

export function DemoKitchen() {
  return <KitchenApp source={demoSource} demo />;
}
