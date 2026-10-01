"use client";

import Link from "next/link";
import { ArrowLeft, Store } from "lucide-react";
import { useCartLines, useCartStore, useCartSubtotal } from "@/features/cart/store";
import { EmptyCart } from "@/components/cart/EmptyCart";
import { CheckoutForm } from "./CheckoutForm";
import { OrderSummary } from "./OrderSummary";

/** Page /commande : formulaire à gauche, récapitulatif fixe à droite (repliable en haut sur mobile). */
export function CheckoutView({ address, phoneHref }: { address: string | null; phoneHref: string | null }) {
  const hydrated = useCartStore((s) => s.hydrated);
  const lines = useCartLines();
  const subtotal = useCartSubtotal();

  if (!hydrated) {
    return (
      <div className="container-x py-16" aria-busy="true">
        <div className="h-14 w-64 animate-pulse rounded-2xl bg-paper" />
        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="h-96 animate-pulse rounded-[22px] bg-white" />
          <div className="hidden h-80 animate-pulse rounded-[22px] bg-white lg:block" />
        </div>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="container-x py-10 lg:py-16">
        <EmptyCart headingLevel="h1" />
      </div>
    );
  }

  return (
    <div className="container-x pt-6 pb-20 lg:pt-12 lg:pb-28">
      <Link href="/menu" className="inline-flex min-h-11 items-center gap-2 text-[15px] font-semibold text-royal">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Continuer mes achats
      </Link>
      <h1 className="display mt-2 text-[clamp(3rem,7vw,5rem)] text-deep">Ma commande</h1>
      <p className="mt-3 flex items-center gap-2 text-[17px] text-slate">
        <Store className="size-5 shrink-0 text-royal" aria-hidden="true" />
        Commande à retirer à La Perle Bleue.
      </p>

      <div className="mt-8 grid items-start gap-5 lg:mt-10 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-10 xl:grid-cols-[minmax(0,1fr)_440px]">
        <div className="lg:hidden">
          <OrderSummary lines={lines} subtotal={subtotal} collapsible />
        </div>
        <CheckoutForm lines={lines} subtotal={subtotal} address={address} phoneHref={phoneHref} />
        <aside className="sticky top-[calc(var(--header-h)+24px)] hidden lg:block">
          <OrderSummary lines={lines} subtotal={subtotal} />
        </aside>
      </div>
    </div>
  );
}
