"use client";

import Link from "next/link";
import { AlertCircle, Info, Loader2, Lock, Store } from "lucide-react";
import { useCallback, useEffect, useId, useState, type FormEvent, type InputHTMLAttributes, type ReactNode } from "react";
import type { CartLine } from "@/features/cart/store";
import { useOrderUI } from "@/features/cart/ui";
import { createDemoOrder, demoPickupAvailability, useDemo } from "@/features/demo/store";
import { describeForKitchen } from "@/features/order/pricing";
import { useOrderingState } from "@/features/live/store";
import { formatSlot, type PickupAvailability } from "@/features/order/pickup";
import type { CheckoutRequest, CheckoutResponse, Customer } from "@/features/order/types";
import { ORDER_NOTE_MAX, validateCustomer } from "@/features/order/validation";
import { formatEuros } from "@/lib/money";
import { cn } from "@/lib/utils";
import { buttonClasses } from "@/components/ui/Button";

type Status = { type: "idle" } | { type: "loading" } | { type: "message"; tone: "info" | "error"; text: string };

const ERROR = "text-[#b42318]";
const FIELDS: (keyof Customer)[] = ["firstName", "lastName", "phone", "email"];

const newAttemptId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
        (Number(c) ^ ((Math.random() * 16) >> (Number(c) / 4))).toString(16),
      );

/**
 * Formulaire de commande : 1. coordonnées, 2. retrait, 3. récapitulatif, 4. paiement.
 * N'envoie que des identifiants : le serveur recalcule le montant et crée le paiement Mollie.
 */
export function CheckoutForm({
  lines,
  subtotal,
  address,
  phoneHref,
  cancelledPayment,
}: {
  lines: CartLine[];
  subtotal: number;
  address: string | null;
  phoneHref: string | null;
  cancelledPayment: boolean;
}) {
  const uid = useId();
  const openCart = useOrderUI((s) => s.openCart);
  const ordering = useOrderingState();
  const demo = useDemo((s) => s.active);
  const [customer, setCustomer] = useState<Customer>({ firstName: "", lastName: "", phone: "", email: "" });
  const [touched, setTouched] = useState<Partial<Record<keyof Customer, boolean>>>({});
  const [serverErrors, setServerErrors] = useState<Partial<Record<keyof Customer, string>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [pickupMode, setPickupMode] = useState<"ASAP" | "SCHEDULED">("ASAP");
  const [slot, setSlot] = useState("");
  const [note, setNote] = useState("");
  const [availability, setAvailability] = useState<PickupAvailability | null>(null);
  const [status, setStatus] = useState<Status>(
    cancelledPayment
      ? { type: "message", tone: "info", text: "Paiement annulé : aucun montant n'a été débité. Votre panier est conservé, vous pouvez réessayer." }
      : { type: "idle" },
  );

  const loadSlots = useCallback(async () => {
    if (demo) {
      setAvailability(demoPickupAvailability());
      return;
    }
    try {
      const res = await fetch("/api/pickup-slots", { cache: "no-store" });
      if (res.ok) setAvailability((await res.json()) as PickupAvailability);
    } catch {
      // réseau : on garde les créneaux connus
    }
  }, [demo]);

  useEffect(() => {
    void loadSlots();
    const id = window.setInterval(loadSlots, 60_000);
    return () => window.clearInterval(id);
  }, [loadSlots]);

  useEffect(() => {
    if (!availability) return;
    if (!availability.asap.available && availability.slots.some((s) => s.available)) setPickupMode("SCHEDULED");
    if (slot && !availability.slots.some((s) => s.time === slot && s.available)) setSlot("");
  }, [availability]); // eslint-disable-line react-hooks/exhaustive-deps

  const clientErrors = validateCustomer(customer);
  const fieldError = (k: keyof Customer) => serverErrors[k] ?? (touched[k] || submitted ? clientErrors[k] : undefined);
  const slotError = submitted && pickupMode === "SCHEDULED" && !slot ? "Choisissez une heure de retrait." : undefined;
  const freeSlots = availability?.slots.filter((s) => s.available) ?? [];
  const noPickup = !!availability && !availability.asap.available && freeSlots.length === 0;
  const blocked = !ordering.canOrder
    ? ordering.message
    : lines.some((l) => l.unavailable)
      ? "Un article de votre panier est indisponible. Modifiez-le ou supprimez-le."
      : noPickup
        ? "Plus aucun créneau de retrait aujourd'hui. Votre panier reste enregistré."
        : null;
  const fieldIds = { firstName: `${uid}-prenom`, lastName: `${uid}-nom`, phone: `${uid}-tel`, email: `${uid}-email` };
  const pickupLabel =
    pickupMode === "ASAP"
      ? availability?.asap.readyAt
        ? `Dès que possible (vers ${formatSlot(availability.asap.readyAt)})`
        : "Dès que possible"
      : slot
        ? `Aujourd'hui à ${formatSlot(slot)}`
        : "Heure à choisir";

  const set = (k: keyof Customer) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomer((c) => ({ ...c, [k]: e.target.value }));
    setServerErrors((s) => ({ ...s, [k]: undefined }));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (status.type === "loading" || blocked) return;
    setSubmitted(true);
    const firstInvalid = FIELDS.find((k) => clientErrors[k]);
    if (firstInvalid) {
      document.getElementById(fieldIds[firstInvalid])?.focus();
      return;
    }
    if (pickupMode === "SCHEDULED" && !slot) {
      document.getElementById(`${uid}-heure`)?.focus();
      return;
    }
    // Bouton désactivé immédiatement : un seul paiement par clic.
    setStatus({ type: "loading" });
    if (demo) {
      // Démonstration : rien n'est envoyé au serveur, la commande reste sur cet appareil.
      const order = createDemoOrder({
        customer,
        pickup: pickupMode === "ASAP" ? { type: "ASAP" } : { type: "SCHEDULED", time: slot },
        note: note.trim() || undefined,
        total: subtotal,
        items: lines.map((l) => ({
          productName: l.product.name,
          quantity: l.quantity,
          summary: l.summary,
          kitchenLines: describeForKitchen(l.product, l.options),
          note: l.note,
        })),
      });
      window.location.assign(`/demo/paiement/${order.id}`);
      return;
    }
    const body: CheckoutRequest = {
      attemptId: newAttemptId(),
      items: lines.map((l) => ({ productId: l.productId, options: l.options, quantity: l.quantity, note: l.note })),
      customer,
      pickup: pickupMode === "ASAP" ? { type: "ASAP" } : { type: "SCHEDULED", time: slot },
      fulfillment: "PICKUP",
      note: note.trim() || undefined,
    };
    try {
      const res = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = (await res.json()) as CheckoutResponse;
      if (data.ok) {
        window.location.assign(data.checkoutUrl); // page de paiement sécurisée Mollie
        return;
      }
      if (data.fieldErrors) setServerErrors(data.fieldErrors);
      if (data.code === "PICKUP_UNAVAILABLE") void loadSlots();
      setStatus({ type: "message", tone: "error", text: data.message });
    } catch {
      setStatus({ type: "message", tone: "error", text: "Connexion impossible. Vérifiez votre réseau puis réessayez." });
    }
  };

  const alertText = blocked ?? (status.type === "message" ? status.text : null);
  const alertIsError = !blocked && status.type === "message" && status.tone === "error";

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <Step n={1} title="Vos coordonnées">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id={fieldIds.firstName} label="Prénom" autoComplete="given-name" value={customer.firstName} onChange={set("firstName")} onBlur={() => setTouched((t) => ({ ...t, firstName: true }))} error={fieldError("firstName")} hint="Pour vous appeler au comptoir." />
          <Field id={fieldIds.lastName} label="Nom" autoComplete="family-name" value={customer.lastName} onChange={set("lastName")} onBlur={() => setTouched((t) => ({ ...t, lastName: true }))} error={fieldError("lastName")} />
          <Field id={fieldIds.phone} label="Téléphone" type="tel" inputMode="tel" autoComplete="tel" value={customer.phone} onChange={set("phone")} onBlur={() => setTouched((t) => ({ ...t, phone: true }))} error={fieldError("phone")} hint="En cas de question sur la commande." />
          <Field id={fieldIds.email} label="E-mail" type="email" inputMode="email" autoComplete="email" value={customer.email} onChange={set("email")} onBlur={() => setTouched((t) => ({ ...t, email: true }))} error={fieldError("email")} hint="Confirmation et suivi de commande." />
        </div>
      </Step>

      <Step n={2} title="Heure de retrait">
        <p className="flex gap-3 rounded-2xl bg-cream p-4 text-[15px] text-night">
          <Store className="mt-0.5 size-5 shrink-0 text-royal" aria-hidden="true" />
          <span>
            <strong>Retrait sur place uniquement.</strong> Commande à retirer à La Perle Bleue{address ? `, ${address}` : ""}.
          </span>
        </p>

        {!availability ? (
          <p className="mt-5 flex items-center gap-2 text-slate">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Chargement des créneaux…
          </p>
        ) : (
          <>
            <div role="radiogroup" aria-label="Heure de retrait" className="mt-5 grid gap-3 sm:grid-cols-2">
              <Choice
                name={`${uid}-retrait`}
                checked={pickupMode === "ASAP"}
                disabled={!availability.asap.available}
                onSelect={() => setPickupMode("ASAP")}
                title="Dès que possible"
                text={
                  availability.asap.available && availability.asap.readyAt
                    ? `Prête vers ${formatSlot(availability.asap.readyAt)} (${availability.preparationDelay} min)`
                    : "Indisponible pour le moment"
                }
              />
              <Choice
                name={`${uid}-retrait`}
                checked={pickupMode === "SCHEDULED"}
                disabled={!freeSlots.length}
                onSelect={() => setPickupMode("SCHEDULED")}
                title="Choisir une heure"
                text={freeSlots.length ? `Aujourd'hui, à partir de ${formatSlot(freeSlots[0].time)}` : "Plus de créneau aujourd'hui"}
              />
            </div>

            {pickupMode === "SCHEDULED" && freeSlots.length > 0 && (
              <div className="mt-5">
                <label htmlFor={`${uid}-heure`} className="block text-[15px] font-semibold text-night">
                  Heure de retrait
                </label>
                <select
                  id={`${uid}-heure`}
                  value={slot}
                  onChange={(e) => setSlot(e.target.value)}
                  aria-invalid={!!slotError}
                  aria-describedby={slotError ? `${uid}-heure-error` : undefined}
                  className={cn("mt-2 h-13 w-full rounded-2xl border bg-white px-4 text-base text-night sm:max-w-xs", slotError ? "border-[#b42318]" : "border-line")}
                >
                  <option value="">Choisir une heure…</option>
                  {availability.slots.map((s) => (
                    <option key={s.time} value={s.time} disabled={!s.available}>
                      Aujourd&apos;hui, {formatSlot(s.time)}
                      {s.available ? "" : " — complet"}
                    </option>
                  ))}
                </select>
                {slotError && (
                  <p id={`${uid}-heure-error`} className={cn("mt-1.5 text-sm font-semibold", ERROR)}>
                    {slotError}
                  </p>
                )}
              </div>
            )}
          </>
        )}

        <div className="mt-6">
          <label htmlFor={`${uid}-note`} className="flex items-baseline justify-between gap-3 text-[15px] font-semibold text-night">
            Un message pour le restaurant&nbsp;?
            <span className="text-xs font-bold tracking-wide text-slate uppercase">Facultatif</span>
          </label>
          <textarea
            id={`${uid}-note`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={ORDER_NOTE_MAX}
            rows={2}
            placeholder="Ex. : couverts, j'arrive un peu plus tard…"
            className="mt-2 w-full resize-none rounded-2xl border border-line bg-white px-4 py-3 text-base text-night placeholder:text-slate/70"
          />
        </div>
      </Step>

      <Step n={3} title="Récapitulatif">
        <dl className="grid gap-3 text-[15px] sm:grid-cols-3">
          <div className="rounded-2xl bg-cream p-4">
            <dt className="text-sm text-slate">Articles</dt>
            <dd className="font-bold text-night">{lines.reduce((n, l) => n + l.quantity, 0)}</dd>
          </div>
          <div className="rounded-2xl bg-cream p-4">
            <dt className="text-sm text-slate">Retrait</dt>
            <dd className="font-bold text-night">{pickupLabel}</dd>
          </div>
          <div className="rounded-2xl bg-cream p-4">
            <dt className="text-sm text-slate">Total</dt>
            <dd className="font-display text-2xl font-extrabold text-night tabular-nums">{formatEuros(subtotal)}</dd>
          </div>
        </dl>
        <button type="button" onClick={openCart} className="link-line mt-3 text-sm font-semibold text-royal">
          Modifier le panier
        </button>
      </Step>

      <Step n={4} title="Paiement">
        <div className="flex items-start gap-3 rounded-2xl border border-line p-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-royal/10">
            <Lock className="size-5 text-royal" aria-hidden="true" />
          </span>
          <div>
            <p className="font-semibold text-night">Carte bancaire, page sécurisée Mollie</p>
            <p className="mt-0.5 text-sm text-slate">
              Votre carte est d&apos;abord seulement <strong>autorisée</strong>. Elle n&apos;est débitée que lorsque le restaurant
              accepte votre commande. Si la commande est refusée, rien n&apos;est débité.
            </p>
          </div>
        </div>

        {alertText && (
          <div role="alert" className={cn("mt-5 flex gap-3 rounded-2xl p-4 text-[15px]", alertIsError ? "bg-[#fef3f2] text-[#7a271a]" : "bg-royal/8 text-night")}>
            {alertIsError ? (
              <AlertCircle className={cn("mt-0.5 size-5 shrink-0", ERROR)} aria-hidden="true" />
            ) : (
              <Info className="mt-0.5 size-5 shrink-0 text-royal" aria-hidden="true" />
            )}
            <span>
              {alertText}
              {phoneHref && (blocked || alertIsError) && (
                <>
                  {" "}
                  <a href={phoneHref} className="font-semibold text-royal underline underline-offset-2">
                    Appeler le restaurant
                  </a>
                </>
              )}
            </span>
          </div>
        )}

        <button
          type="submit"
          disabled={status.type === "loading" || !!blocked || !availability}
          className={buttonClasses({ size: "lg", className: "mt-6 min-h-16 w-full text-[15.5px]" })}
        >
          {status.type === "loading" ? (
            <>
              <Loader2 className="size-5 animate-spin" aria-hidden="true" />
              Redirection vers le paiement…
            </>
          ) : (
            <>
              <Lock className="size-[18px]" aria-hidden="true" />
              Payer {formatEuros(subtotal)}
            </>
          )}
        </button>
        <p className="mt-3 text-center text-sm text-slate">
          En payant, vous acceptez nos{" "}
          <Link href="/cgv" className="font-semibold text-royal underline underline-offset-2">
            conditions générales de vente
          </Link>
          .
        </p>
      </Step>
    </form>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  const id = `etape-${n}`;
  return (
    <section aria-labelledby={id} className="rounded-[22px] bg-white p-5 ring-1 ring-line sm:p-7">
      <h2 id={id} className="flex items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-royal font-display text-lg font-extrabold text-white">{n}</span>
        <span className="display text-[2rem] text-deep">{title}</span>
      </h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Field({
  id,
  label,
  error,
  hint,
  className,
  ...input
}: InputHTMLAttributes<HTMLInputElement> & { id: string; label: string; error?: string; hint?: string }) {
  const describedBy = [hint && !error && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ");
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-[15px] font-semibold text-night">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={!!error}
        aria-required="true"
        aria-describedby={describedBy || undefined}
        className={cn("mt-2 h-13 w-full rounded-2xl border bg-white px-4 text-base text-night", error ? "border-[#b42318]" : "border-line hover:border-night/30")}
        {...input}
      />
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-sm text-slate">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className={cn("mt-1.5 text-sm font-semibold", ERROR)}>
          {error}
        </p>
      )}
    </div>
  );
}

function Choice({
  name,
  checked,
  disabled,
  onSelect,
  title,
  text,
}: {
  name: string;
  checked: boolean;
  disabled?: boolean;
  onSelect: () => void;
  title: string;
  text: string;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 transition-colors",
        "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-royal",
        checked ? "border-royal bg-royal/5" : "border-line hover:border-night/25",
        disabled && "cursor-not-allowed opacity-50 hover:border-line",
      )}
    >
      <input type="radio" name={name} checked={checked} disabled={disabled} onChange={onSelect} className="sr-only" />
      <span aria-hidden="true" className={cn("mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2", checked ? "border-royal" : "border-night/25")}>
        {checked && <span className="size-2.5 rounded-full bg-royal" />}
      </span>
      <span>
        <span className="block font-bold text-night">{title}</span>
        <span className="block text-sm text-slate">{text}</span>
      </span>
    </label>
  );
}
