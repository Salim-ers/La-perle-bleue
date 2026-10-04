"use client";

import Link from "next/link";
import { BellOff, BellRing, Database, Loader2, Phone, Plus, Power, Settings, Wifi, WifiOff, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { KitchenOrder } from "@/features/kitchen/types";
import { REFUSAL_REASONS, type KitchenAction, type OrderStatus, type RefusalReason } from "@/features/order/types";
import { formatEuros } from "@/lib/money";
import { cn } from "@/lib/utils";
import { apiKitchenSource, useAlarm, useKitchenOrders, useWakeLock, type KitchenSource } from "./useKitchen";

const COLUMNS: { title: string; statuses: OrderStatus[]; tone: string }[] = [
  { title: "Nouvelles", statuses: ["NEW"], tone: "border-[#f79009]" },
  { title: "En préparation", statuses: ["ACCEPTED", "PREPARING"], tone: "border-[#2e90fa]" },
  { title: "Prêtes", statuses: ["READY"], tone: "border-[#12b76a]" },
];

const NEXT: Partial<Record<OrderStatus, { action: KitchenAction; label: string; className: string }>> = {
  NEW: { action: "accept", label: "Accepter", className: "bg-[#12b76a] text-[#052e1a]" },
  ACCEPTED: { action: "start", label: "Commencer la préparation", className: "bg-[#2e90fa] text-white" },
  PREPARING: { action: "ready", label: "Marquer prête", className: "bg-[#12b76a] text-[#052e1a]" },
  READY: { action: "complete", label: "Terminée", className: "bg-white text-[#0b1220]" },
};

const STATUS_LABEL: Partial<Record<OrderStatus, string>> = {
  NEW: "Nouvelle",
  ACCEPTED: "Acceptée",
  PREPARING: "En préparation",
  READY: "Prête",
};

export function KitchenApp({
  source = apiKitchenSource,
  demo = false,
  onSimulate,
}: {
  source?: KitchenSource;
  demo?: boolean;
  /** Démo : crée une commande client fictive (tablette seule). */
  onSimulate?: () => void;
}) {
  const { snapshot, online, setup, refresh } = useKitchenOrders(source);
  const [started, setStarted] = useState(false);
  const [mutedIds, setMutedIds] = useState<string[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [refuseId, setRefuseId] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const orders = useMemo(() => snapshot?.orders ?? [], [snapshot]);
  const newOrders = orders.filter((o) => o.status === "NEW");
  // Sonnerie tant qu'une nouvelle commande n'est ni acceptée, ni refusée, ni mise en silence.
  const ringing = newOrders.some((o) => !mutedIds.includes(o.id));
  const { unlocked, unlock } = useAlarm(ringing);
  useWakeLock(started);

  const popup = newOrders.find((o) => !dismissedIds.includes(o.id)) ?? null;
  const detail = orders.find((o) => o.id === detailId) ?? null;
  const refusing = orders.find((o) => o.id === refuseId) ?? null;

  const run = async (order: KitchenOrder, action: KitchenAction, reason?: RefusalReason) => {
    if (busy) return; // anti double clic
    setBusy(`${order.id}:${action}`);
    setError(null);
    const message = await source.act(order.id, action, reason);
    if (message) setError(`#${order.number} : ${message}`);
    else if (action === "refuse" || action === "complete") setDetailId(null);
    setRefuseId(null);
    await refresh();
    setBusy(null);
  };

  const togglePause = async () => {
    if (!snapshot) return;
    const enable = !snapshot.settings.ordersEnabled;
    if (!enable && !window.confirm("Suspendre les commandes en ligne ? Les clients ne pourront plus commander.")) return;
    await source.setOrdersEnabled(enable);
    await refresh();
  };

  const simulate = async () => {
    onSimulate?.();
    await refresh();
  };

  if (setup) return <SetupScreen />;

  if (!started) {
    return (
      <main className="grid min-h-svh place-items-center p-6 text-center">
        <div>
          <p className="text-lg text-white/70">La Perle Bleue</p>
          <h1 className="mt-1 text-5xl font-black">Cuisine</h1>
          <button
            type="button"
            onClick={() => {
              unlock();
              setStarted(true);
            }}
            className="mt-10 flex min-h-24 items-center gap-3 rounded-3xl bg-[#12b76a] px-12 text-3xl font-black text-[#052e1a] uppercase"
          >
            <Power className="size-9" aria-hidden="true" />
            Démarrer le service
          </button>
          <p className="mx-auto mt-6 max-w-sm text-white/70">Active la sonnerie des nouvelles commandes et garde l&apos;écran allumé.</p>
          {demo && <p className="mx-auto mt-3 max-w-sm font-bold text-[#fdb022]">Démonstration : aucune vraie commande, aucun paiement.</p>}
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b border-white/10 bg-[#0b1220]/95 px-4 py-3 backdrop-blur">
        <h1 className="text-2xl font-black">Cuisine</h1>
        {demo && <span className="rounded-full bg-[#7a2e0e] px-3 py-1.5 text-sm font-bold uppercase">Démo</span>}
        <span
          role="status"
          className={cn("flex items-center gap-2 rounded-full px-3 py-1.5 text-base font-bold", online ? "bg-[#12b76a]/15 text-[#6ce9a6]" : "animate-pulse bg-[#f04438] text-white")}
        >
          {online ? <Wifi className="size-5" aria-hidden="true" /> : <WifiOff className="size-5" aria-hidden="true" />}
          {online ? "En ligne" : "🔴 Connexion perdue — nouvel essai…"}
        </span>
        {!unlocked && (
          <button type="button" onClick={unlock} className="rounded-full bg-[#f79009] px-4 py-2 font-bold text-[#2b1700]">
            Activer le son
          </button>
        )}
        <div className="ml-auto flex items-center gap-2">
          {onSimulate && (
            <button type="button" onClick={simulate} className="flex min-h-12 items-center gap-2 rounded-full bg-[#2e90fa] px-4 text-base font-bold text-white">
              <Plus className="size-5" aria-hidden="true" /> Simuler une commande
            </button>
          )}
          {snapshot && (
            <button
              type="button"
              onClick={togglePause}
              className={cn("min-h-12 rounded-full px-4 text-base font-bold", snapshot.settings.ordersEnabled ? "bg-white/10" : "bg-[#f04438] text-white")}
            >
              {snapshot.settings.ordersEnabled ? "Commandes : ON" : "Commandes : OFF"}
            </button>
          )}
          {ringing && (
            <button
              type="button"
              onClick={() => setMutedIds((ids) => [...ids, ...newOrders.map((o) => o.id)])}
              className="flex min-h-12 items-center gap-2 rounded-full bg-[#f79009] px-4 text-base font-bold text-[#2b1700]"
            >
              <BellOff className="size-5" aria-hidden="true" /> Mute
            </button>
          )}
          <Link href={demo ? "/demo/reglages" : "/admin/reglages"} className="flex min-h-12 items-center gap-2 rounded-full bg-white/10 px-4 text-base font-bold">
            <Settings className="size-5" aria-hidden="true" /> Réglages
          </Link>
        </div>
      </header>

      {error && (
        <div role="alert" className="mx-4 mt-3 flex items-center justify-between gap-3 rounded-2xl bg-[#f04438] px-4 py-3 text-lg font-bold">
          {error}
          <button type="button" onClick={() => setError(null)} aria-label="Fermer" className="grid size-10 place-items-center rounded-full bg-black/20">
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
      )}

      {demo && snapshot && orders.length === 0 && (
        <p className="mx-4 mt-3 rounded-2xl bg-[#7a2e0e] px-4 py-3 text-lg">
          <strong>Démo :</strong> passez une commande sur le site ouvert avec <strong>?demo=1</strong> dans ce même navigateur (autre onglet), elle
          arrive ici avec la sonnerie. Sur une tablette seule, appuyez sur <strong>« Simuler une commande »</strong>.
        </p>
      )}

      {!snapshot ? (
        <p className="m-auto flex items-center gap-3 text-2xl text-white/70">
          <Loader2 className="size-7 animate-spin" aria-hidden="true" /> Chargement…
        </p>
      ) : (
        <div className="grid flex-1 gap-4 p-4 md:grid-cols-3">
          {COLUMNS.map((col) => {
            const list = orders.filter((o) => col.statuses.includes(o.status));
            return (
              <section key={col.title} aria-label={col.title} className="flex min-h-0 flex-col rounded-3xl bg-white/[0.03] p-3">
                <h2 className={cn("mb-3 flex items-center justify-between gap-2 border-b-4 px-1 pb-2 text-xl font-black uppercase lg:text-2xl", col.tone)}>
                  {col.title}
                  <span className="rounded-full bg-white/10 px-3 text-xl tabular-nums">{list.length}</span>
                </h2>
                <ul className="space-y-3">
                  {list.map((o) => (
                    <li key={o.id}>
                      <OrderCard order={o} busy={busy} onOpen={() => setDetailId(o.id)} onAction={(a) => (a === "refuse" ? setRefuseId(o.id) : run(o, a))} />
                    </li>
                  ))}
                  {list.length === 0 && <li className="px-2 py-6 text-center text-lg text-white/40">Aucune commande</li>}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      {popup && !refusing && (
        <Modal label={`Nouvelle commande ${popup.number}`} onClose={() => setDismissedIds((ids) => [...ids, popup.id])} accent>
          <p className="flex items-center gap-3 text-2xl font-black text-[#f79009] uppercase">
            <BellRing className="size-8 animate-bounce" aria-hidden="true" /> Nouvelle commande
          </p>
          <OrderDetail order={popup} />
          {/* Boutons toujours visibles, même pour une longue commande. */}
          <div className="sticky bottom-0 -mx-6 -mb-6 mt-6 border-t border-white/10 bg-[#131c2e] px-6 pt-4 pb-6 sm:-mx-8 sm:-mb-8 sm:px-8 sm:pb-8 grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setRefuseId(popup.id)} className="min-h-20 rounded-2xl bg-[#f04438] text-2xl font-black uppercase">
              Refuser
            </button>
            <ActionButton order={popup} action="accept" busy={busy} onClick={() => run(popup, "accept")} className="min-h-20 bg-[#12b76a] text-2xl text-[#052e1a]">
              Accepter
            </ActionButton>
          </div>
        </Modal>
      )}

      {detail && !popup && !refusing && (
        <Modal label={`Commande ${detail.number}`} onClose={() => setDetailId(null)}>
          <OrderDetail order={detail} />
          <div className="sticky bottom-0 -mx-6 -mb-6 mt-6 border-t border-white/10 bg-[#131c2e] px-6 pt-4 pb-6 sm:-mx-8 sm:-mb-8 sm:px-8 sm:pb-8 grid gap-3 sm:grid-cols-2">
            {(detail.status === "NEW" || detail.status === "ACCEPTED") && (
              <button type="button" onClick={() => setRefuseId(detail.id)} className="min-h-16 rounded-2xl bg-[#f04438] text-xl font-black uppercase">
                Refuser
              </button>
            )}
            {NEXT[detail.status] && (
              <ActionButton
                order={detail}
                action={NEXT[detail.status]!.action}
                busy={busy}
                onClick={() => run(detail, NEXT[detail.status]!.action)}
                className={cn("min-h-16 text-xl", NEXT[detail.status]!.className)}
              >
                {NEXT[detail.status]!.label}
              </ActionButton>
            )}
          </div>
        </Modal>
      )}

      {refusing && (
        <RefuseDialog order={refusing} busy={busy} onCancel={() => setRefuseId(null)} onConfirm={(reason) => run(refusing, "refuse", reason)} />
      )}
    </main>
  );
}

/** Vraie cuisine avant la mise en service : la base de données n'est pas encore branchée. */
function SetupScreen() {
  return (
    <main className="grid min-h-svh place-items-center p-6">
      <div className="w-full max-w-xl rounded-3xl bg-[#131c2e] p-8 ring-1 ring-white/10">
        <Database className="size-10 text-[#fdb022]" aria-hidden="true" />
        <h1 className="mt-4 text-3xl font-black">Commandes en ligne pas encore branchées</h1>
        <p className="mt-3 text-lg text-white/80">
          Les vraies commandes apparaîtront ici dès que la base de données et le paiement seront configurés sur Vercel (voir README-PRODUCTION.md).
        </p>
        <p className="mt-3 text-lg text-white/80">Pour présenter le fonctionnement au restaurateur, utilisez la démonstration :</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link href="/demo/cuisine" className="flex min-h-16 items-center justify-center rounded-2xl bg-[#12b76a] px-4 text-center text-lg font-black text-[#052e1a] uppercase">
            Cuisine de démo
          </Link>
          <a href="/?demo=1" target="_blank" rel="noopener" className="flex min-h-16 items-center justify-center rounded-2xl bg-white/10 px-4 text-center text-lg font-black uppercase">
            Site en mode démo
          </a>
        </div>
      </div>
    </main>
  );
}

function OrderCard({
  order,
  busy,
  onOpen,
  onAction,
}: {
  order: KitchenOrder;
  busy: string | null;
  onOpen: () => void;
  onAction: (action: KitchenAction) => void;
}) {
  const next = NEXT[order.status];
  return (
    <article className={cn("rounded-2xl bg-[#131c2e] p-4 ring-1", order.status === "NEW" ? "ring-2 ring-[#f79009]" : "ring-white/10")}>
      <button type="button" onClick={onOpen} className="block w-full text-left">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-3xl font-black tabular-nums lg:text-4xl">#{order.number}</p>
          <p className="text-xl font-black tabular-nums lg:text-2xl">{formatEuros(order.total)}</p>
        </div>
        <p className="mt-1 text-lg text-white/70">
          {order.createdLabel} · {order.customer.name} · <span className="text-white/90">{STATUS_LABEL[order.status]}</span>
        </p>
        <p className="mt-2 inline-block rounded-xl bg-white px-3 py-1 text-lg font-black text-[#0b1220] lg:text-xl">
          Retrait {order.pickupType === "ASAP" ? `≈ ${order.pickupLabel}` : order.pickupLabel}
        </p>
        <ul className="mt-3 space-y-0.5 text-lg font-bold lg:text-xl">
          {order.items.map((item, i) => (
            <li key={i}>
              {item.quantity} × {item.productName}
            </li>
          ))}
        </ul>
        {order.notes && <p className="mt-2 rounded-xl bg-[#f79009]/20 px-3 py-2 text-lg font-semibold">Note : {order.notes}</p>}
        <p className="mt-2 text-base font-semibold text-[#84caff] underline">Voir le détail</p>
      </button>
      {next && (
        <div className={cn("mt-3 grid gap-2", order.status === "NEW" && "grid-cols-2 md:grid-cols-1 lg:grid-cols-2")}>
          {order.status === "NEW" && (
            <button type="button" onClick={() => onAction("refuse")} className="min-h-16 rounded-2xl bg-[#f04438] text-lg font-black uppercase">
              Refuser
            </button>
          )}
          {/* Empilés (tablette portrait) : ACCEPTER en haut, là où l'on tape par réflexe. */}
          <ActionButton
            order={order}
            action={next.action}
            busy={busy}
            onClick={() => onAction(next.action)}
            className={cn("min-h-16 text-lg", next.className, order.status === "NEW" && "md:order-first lg:order-none")}
          >
            {next.label}
          </ActionButton>
        </div>
      )}
    </article>
  );
}

function ActionButton({
  order,
  action,
  busy,
  onClick,
  className,
  children,
}: {
  order: KitchenOrder;
  action: KitchenAction;
  busy: string | null;
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  const loading = busy === `${order.id}:${action}`;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!!busy}
      className={cn("flex items-center justify-center gap-2 rounded-2xl font-black uppercase disabled:opacity-60", className)}
    >
      {loading && <Loader2 className="size-6 animate-spin" aria-hidden="true" />}
      {loading && action === "accept" ? "Encaissement…" : children}
    </button>
  );
}

function OrderDetail({ order }: { order: KitchenOrder }) {
  return (
    <div>
      <div className="mt-2 flex flex-wrap items-baseline justify-between gap-3">
        <p className="text-6xl font-black tabular-nums">#{order.number}</p>
        <p className="text-4xl font-black tabular-nums">{formatEuros(order.total)}</p>
      </div>
      <p className="mt-2 text-2xl font-black">
        Retrait : {order.pickupType === "ASAP" ? `dès que possible (≈ ${order.pickupLabel})` : order.pickupLabel}
      </p>
      <p className="mt-1 flex flex-wrap items-center gap-3 text-lg text-white/80">
        Reçue à {order.createdLabel} · {order.customer.name}
        <a href={`tel:${order.customer.phone}`} className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 font-bold text-white">
          <Phone className="size-4" aria-hidden="true" /> {order.customer.phone}
        </a>
      </p>
      <ul className="mt-5 space-y-4">
        {order.items.map((item, i) => (
          <li key={i} className="rounded-2xl bg-white/[0.06] p-4">
            <p className="text-2xl font-black">
              {item.quantity} × {item.productName}
            </p>
            {item.kitchenLines.length > 0 && (
              <ul className="mt-2 space-y-1 text-xl">
                {item.kitchenLines.map((line) => (
                  <li key={line} className={cn(line.includes("SANS ") && "font-bold text-[#fda29b]")}>
                    – {line}
                  </li>
                ))}
              </ul>
            )}
            {item.note && <p className="mt-2 rounded-xl bg-[#f79009]/20 px-3 py-2 text-xl font-bold">« {item.note} »</p>}
          </li>
        ))}
      </ul>
      {order.notes && <p className="mt-4 rounded-2xl bg-[#f79009]/20 p-4 text-xl font-bold">Message du client : {order.notes}</p>}
    </div>
  );
}

function RefuseDialog({
  order,
  busy,
  onCancel,
  onConfirm,
}: {
  order: KitchenOrder;
  busy: string | null;
  onCancel: () => void;
  onConfirm: (reason: RefusalReason) => void;
}) {
  const [reason, setReason] = useState<RefusalReason>("rupture");
  return (
    <Modal label={`Refuser la commande ${order.number}`} onClose={onCancel}>
      <h2 className="text-4xl font-black">Refuser la commande #{order.number} ?</h2>
      <p className="mt-2 text-xl text-white/80">
        {order.paymentStatus === "CAPTURED" ? "Le client sera remboursé." : "Le client ne sera pas débité."} Il est prévenu par e-mail.
      </p>
      <fieldset className="mt-6">
        <legend className="text-xl font-bold">Raison (facultatif)</legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {(Object.keys(REFUSAL_REASONS) as RefusalReason[]).map((key) => (
            <label
              key={key}
              className={cn(
                "flex min-h-16 cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 text-xl font-bold has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-white",
                reason === key ? "border-white bg-white/10" : "border-white/15",
              )}
            >
              <input type="radio" name="raison" value={key} checked={reason === key} onChange={() => setReason(key)} className="size-6 accent-white" />
              {REFUSAL_REASONS[key]}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="sticky bottom-0 -mx-6 -mb-6 mt-6 border-t border-white/10 bg-[#131c2e] px-6 pt-4 pb-6 sm:-mx-8 sm:-mb-8 sm:px-8 sm:pb-8 grid grid-cols-2 gap-3">
        <button type="button" onClick={onCancel} className="min-h-16 rounded-2xl bg-white/10 text-xl font-black uppercase">
          Annuler
        </button>
        <ActionButton order={order} action="refuse" busy={busy} onClick={() => onConfirm(reason)} className="min-h-16 bg-[#f04438] text-xl">
          Confirmer le refus
        </ActionButton>
      </div>
    </Modal>
  );
}

function Modal({ label, onClose, accent, children }: { label: string; onClose: () => void; accent?: boolean; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });
  // Monté une seule fois : l'actualisation toutes les 3 s ne doit pas voler le focus.
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>("button")?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeRef.current();
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      previous?.focus?.();
    };
  }, []);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-3 sm:p-6">
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={cn("relative max-h-[94dvh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-[#131c2e] p-6 sm:p-8", accent && "ring-4 ring-[#f79009]")}
      >
        <button type="button" onClick={onClose} aria-label="Fermer" className="absolute top-4 right-4 grid size-12 place-items-center rounded-full bg-white/10">
          <X className="size-6" aria-hidden="true" />
        </button>
        {children}
      </div>
    </div>
  );
}
