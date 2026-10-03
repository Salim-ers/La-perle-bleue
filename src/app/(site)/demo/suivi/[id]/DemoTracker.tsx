"use client";

import { useEffect, useState } from "react";
import { OrderTracker } from "@/components/checkout/OrderTracker";
import { demoPublicStatus } from "@/features/demo/store";
import type { PublicOrderStatus } from "@/features/order/types";

const loadDemo = async (id: string) => {
  const order = demoPublicStatus(id);
  if (!order) throw new Error("introuvable");
  return order;
};

/** Suivi d'une commande de démonstration (lue dans ce navigateur, mise à jour par l'onglet cuisine). */
export function DemoTracker({ id }: { id: string }) {
  const [initial, setInitial] = useState<PublicOrderStatus | null | undefined>(undefined);
  useEffect(() => setInitial(demoPublicStatus(id)), [id]);
  if (initial === undefined) return null;
  if (initial === null) {
    return <p className="container-x py-16 text-lg text-slate">Commande de démonstration introuvable sur cet appareil.</p>;
  }
  return <OrderTracker initial={initial} phoneHref={null} load={loadDemo} />;
}
