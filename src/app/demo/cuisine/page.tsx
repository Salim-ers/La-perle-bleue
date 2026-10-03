import type { Metadata } from "next";
import { DemoKitchen } from "./DemoKitchen";

export const metadata: Metadata = { title: "Cuisine (démonstration)", robots: { index: false, follow: false } };

/** Écran cuisine de démonstration : aucune donnée réelle, commandes de démo de ce navigateur uniquement. */
export default function DemoCuisinePage() {
  return (
    <div className="on-dark min-h-svh bg-[#0b1220] text-white antialiased">
      <DemoKitchen />
    </div>
  );
}
