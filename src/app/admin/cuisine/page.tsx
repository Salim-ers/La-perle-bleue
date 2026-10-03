import type { Metadata } from "next";
import { KitchenApp } from "@/components/admin/KitchenApp";

export const metadata: Metadata = { title: "Commandes" };

/** Écran cuisine (accès protégé par le middleware et revérifié par chaque API). */
export default function CuisinePage() {
  return <KitchenApp />;
}
