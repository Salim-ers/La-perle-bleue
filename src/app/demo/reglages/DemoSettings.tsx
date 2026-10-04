"use client";

import { SettingsApp, type SettingsItem, type SettingsSource } from "@/components/admin/SettingsApp";
import { getDemoSettings, setDemoAvailability, updateDemoSettings, type DemoSettings as Stored } from "@/features/demo/store";

const split = ({ ordersEnabled, preparationDelay, maxOrdersPerSlot, unavailableProducts, unavailableOptions }: Stored) => ({
  settings: { ordersEnabled, preparationDelay, maxOrdersPerSlot },
  availability: { unavailableProducts, unavailableOptions },
});

const demoSource: SettingsSource = {
  load: async () => split(getDemoSettings()),
  patch: async (body) => split(updateDemoSettings(body)).settings,
  setAvailability: async (type, itemId, available) => split(setDemoAvailability(type, itemId, available)).availability,
};

export function DemoSettings(props: { products: SettingsItem[]; options: SettingsItem[]; delays: number[] }) {
  return <SettingsApp {...props} source={demoSource} demo />;
}
