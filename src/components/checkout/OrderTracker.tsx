"use client";

import Link from "next/link";
import { Check, Clock, Loader2, Store, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useCartStore } from "@/features/cart/store";
import { REFUSAL_REASONS, type OrderStatus, type PublicOrderStatus, type RefusalReason } from "@/features/order/types";
import { formatEuros } from "@/lib/money";
import { cn } from "@/lib/utils";
import { buttonClasses } from "@/components/ui/Button";

const STEPS: { status: OrderStatus; label: string; text: string }[] = [
  { status: "NEW", label: "Commande reçue", text: "Le restaurant consulte votre commande." },
  { status: "ACCEPTED", label: "Acceptée", text: "Votre paiement est validé." },
  { status: "PREPARING", label: "En préparation", text: "Ça grille en cuisine." },
  { status: "READY", label: "Prête", text: "Elle vous attend au comptoir." },
];
const ORDER: OrderStatus[] = ["PENDING_PAYMENT", "NEW", "ACCEPTED", "PREPARING", "READY", "COMPLETED"];
const FINAL: OrderStatus[] = ["READY", "COMPLETED", "CANCELLED"];
const PAID: OrderStatus[] = ["NEW", "ACCEPTED", "PREPARING", "READY", "COMPLETED"];

/** Suivi en direct : interroge le serveur toutes les 4 s, s'arrête quand la commande est prête, récupérée ou annulée. */
export function OrderTracker({ initial, phoneHref }: { initial: PublicOrderStatus; phoneHref: string | null }) {
  const [order, setOrder] = useState(initial);
  const [offline, setOffline] = useState(false);
  const clearCart = useCartStore((s) => s.clearCart);
  const hydrated = useCartStore((s) => s.hydrated);
  const cleared = useRef(false);

  useEffect(() => {
    if (FINAL.includes(order.status)) return;
    let stopped = false;
    const tick = async () => {
      try {
        const res = await fetch(`/api/orders/${order.id}/status`, { cache: "no-store" });
        if (!res.ok) throw new Error();
        const next = (await res.json()) as PublicOrderStatus;
        if (!stopped) {
          setOrder(next);
          setOffline(false);
        }
      } catch {
        if (!stopped) setOffline(true);
      }
    };
    const id = window.setInterval(tick, 4000);
    return () => {
      stopped = true;
      window.clearInterval(id);
    };
  }, [order.id, order.status]);

  // Paiement autorisé : le panier a été transmis, on le vide (une seule fois).
  useEffect(() => {
    if (hydrated && !cleared.current && PAID.includes(order.status)) {
      cleared.current = true;
      clearCart();
    }
  }, [hydrated, order.status, clearCart]);

  const index = ORDER.indexOf(order.status);
  const paymentFailed = order.status === "CANCELLED" && (order.paymentStatus === "FAILED" || (order.paymentStatus === "CANCELLED" && !order.cancelReason?.match(/^(rupture|affluence|fermeture|autre)$/)));
  const reason = order.cancelReason && order.cancelReason in REFUSAL_REASONS ? REFUSAL_REASONS[order.cancelReason as RefusalReason] : order.cancelReason;

  return (
    <div className="container-x max-w-3xl py-10 lg:py-16">
      <p className="eyebrow text-royal">Suivi de commande</p>
      <h1 className="display mt-2 text-[clamp(3rem,9vw,5.4rem)] text-deep">Commande #{order.number}</h1>

      {order.status === "PENDING_PAYMENT" && (
        <Banner icon={<Loader2 className="size-6 animate-spin text-royal" aria-hidden="true" />} title="Vérification du paiement…">
          Cela prend quelques secondes. Ne fermez pas cette page.
        </Banner>
      )}

      {order.status === "CANCELLED" && (
        <Banner tone="error" icon={<XCircle className="size-6 text-[#b42318]" aria-hidden="true" />} title={paymentFailed ? "Paiement non abouti" : "Commande annulée"}>
          {paymentFailed ? (
            <>Aucun montant n&apos;a été débité. Votre panier est conservé : vous pouvez réessayer.</>
          ) : (
            <>
              {reason ? `Motif : ${reason}. ` : ""}
              {order.paymentStatus === "REFUNDED" ? "Le montant payé vous est remboursé." : "Aucun montant n'a été débité."}
            </>
          )}
          <span className="mt-4 flex flex-wrap gap-3">
            <Link href={paymentFailed ? "/commande" : "/menu"} className={buttonClasses({ size: "md" })}>
              {paymentFailed ? "Réessayer le paiement" : "Voir la carte"}
            </Link>
            {phoneHref && (
              <a href={phoneHref} className={buttonClasses({ size: "md", variant: "outline-dark" })}>
                Appeler le restaurant
              </a>
            )}
          </span>
        </Banner>
      )}

      {index >= 1 && (
        <ol className="mt-8 space-y-0" aria-label="Étapes de la commande">
          {STEPS.map((step, i) => {
            const done = index >= ORDER.indexOf(step.status);
            const current = order.status === step.status || (order.status === "COMPLETED" && step.status === "READY");
            return (
              <li key={step.status} className="relative flex gap-4 pb-7 last:pb-0">
                {i < STEPS.length - 1 && <span aria-hidden="true" className={cn("absolute top-10 left-[19px] h-[calc(100%-2.5rem)] w-0.5", done ? "bg-royal" : "bg-line")} />}
                <span
                  className={cn(
                    "relative grid size-10 shrink-0 place-items-center rounded-full border-2 transition-colors",
                    done ? "border-royal bg-royal text-white" : "border-line bg-white text-slate",
                    current && "ring-6 ring-royal/15",
                  )}
                >
                  {done ? <Check className="size-5" strokeWidth={3} aria-hidden="true" /> : <span className="size-2 rounded-full bg-current" />}
                </span>
                <div className="pt-1.5">
                  <p className={cn("text-lg font-bold", done ? "text-night" : "text-slate")}>
                    {step.label}
                    {current && <span className="sr-only"> (étape actuelle)</span>}
                  </p>
                  {done && <p className="text-[15px] text-slate">{step.text}</p>}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {order.status !== "CANCELLED" && (
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-line">
            <Clock className="size-6 shrink-0 text-royal" aria-hidden="true" />
            <div>
              <p className="text-sm text-slate">{order.status === "READY" ? "Prête depuis" : "Retrait prévu"}</p>
              <p className="font-display text-2xl font-extrabold text-night">
                {order.pickupType === "ASAP" && order.status !== "READY" ? `vers ${order.pickupAt}` : order.pickupAt}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-line">
            <Store className="size-6 shrink-0 text-royal" aria-hidden="true" />
            <div>
              <p className="text-sm text-slate">À retirer à</p>
              <p className="font-bold text-night">La Perle Bleue, au nom de {order.firstName}</p>
            </div>
          </div>
        </div>
      )}

      <section aria-labelledby="suivi-detail" className="mt-8 rounded-[22px] bg-white p-5 ring-1 ring-line sm:p-6">
        <h2 id="suivi-detail" className="text-lg font-bold text-night">
          Votre commande
        </h2>
        <ul className="mt-3 divide-y divide-line">
          {order.items.map((item, i) => (
            <li key={i} className="py-3">
              <p className="font-semibold text-night">
                {item.quantity} × {item.productName}
              </p>
              {item.summary.map((s) => (
                <p key={s} className="text-sm text-slate">
                  {s}
                </p>
              ))}
            </li>
          ))}
        </ul>
        <p className="mt-3 flex items-baseline justify-between border-t border-line pt-3 text-night">
          <span className="font-bold">Total</span>
          <span className="font-display text-2xl font-extrabold tabular-nums">{formatEuros(order.total)}</span>
        </p>
        {order.status === "NEW" && (
          <p className="mt-2 text-sm text-slate">Votre carte est autorisée ; elle sera débitée quand le restaurant acceptera la commande.</p>
        )}
      </section>

      {offline && (
        <p role="status" className="mt-4 text-sm font-semibold text-[#b42318]">
          Connexion perdue, nouvel essai automatique…
        </p>
      )}
    </div>
  );
}

function Banner({
  icon,
  title,
  children,
  tone = "info",
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  tone?: "info" | "error";
}) {
  return (
    <div role="status" className={cn("mt-6 flex gap-4 rounded-[22px] p-5", tone === "error" ? "bg-[#fef3f2]" : "bg-royal/8")}>
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div className="text-[15px] text-night">
        <p className="text-lg font-bold">{title}</p>
        <div className="mt-1">{children}</div>
      </div>
    </div>
  );
}
