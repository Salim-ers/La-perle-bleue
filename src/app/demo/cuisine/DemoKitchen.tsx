"use client";

import { KitchenApp } from "@/components/admin/KitchenApp";
import type { KitchenSource } from "@/components/admin/useKitchen";
import { demoKitchenAction, demoKitchenSnapshot, updateDemoSettings } from "@/features/demo/store";
import { simulateDemoOrder } from "./sample";

const demoSource: KitchenSource = {
  load: async () => demoKitchenSnapshot(),
  act: demoKitchenAction,
  setOrdersEnabled: async (ordersEnabled) => {
    updateDemoSettings({ ordersEnabled });
  },
};

export function DemoKitchen() {
  return <KitchenApp source={demoSource} demo onSimulate={simulateDemoOrder} />;
}
