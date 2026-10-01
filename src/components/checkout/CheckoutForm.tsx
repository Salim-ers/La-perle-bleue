"use client";

import { AlertCircle, Info, Loader2, Lock, Store } from "lucide-react";
import { useEffect, useId, useState, type FormEvent, type InputHTMLAttributes, type ReactNode } from "react";
import { orderingSettings } from "@/data/ordering";
import { restaurant } from "@/data/restaurant";
import type { CartLine } from "@/features/cart/store";
import { formatSlot, getPickupAvailability, type PickupAvailability } from "@/features/order/pickup";
import type { CheckoutRequest, CheckoutResponse, Customer } from "@/features/order/types";
import { validateCustomer } from "@/features/order/validation";
import { getOpenStatus } from "@/lib/hours";
import { formatEuros } from "@/lib/money";
import { cn } from "@/lib/utils";
import { buttonClasses } from "@/components/ui/Button";

type Status =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "message"; tone: "info" | "error"; text: string };

const ERROR = "text-[#b42318]";

/**
 * Formulaire de commande : coordonnées, retrait, paiement.
 * N'envoie que des identifiants à /api/checkout, qui recalcule le montant.
 */
export function CheckoutForm({
  lines,
  subtotal,
  address,
  phoneHref,
}: {
  lines: CartLine[];
  subtotal: number;
  address: string | null;
  phoneHref: string | null;
}) {
  const uid = useId();
  const [customer, setCustomer] = useState<Customer>({ firstName: "", phone: "", email: "" });
  const [touched, setTouched] = useState<Partial<Record<keyof Customer, boolean>>>({});
  const [serverErrors, setServerErrors] = useState<Partial<Record<keyof Customer, string>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [pickupMode, setPickupMode] = useState<"ASAP" | "SCHEDULED">("ASAP");
  const [slot, setSlot] = useState("");
  const [note, setNote] = useState("");
  const [availability, setAvailability] = useState<PickupAvailability | null>(null);
  const [status, setStatus] = useState<Status>({ type: "idle" });

  // Créneaux calculés à l'heure de Paris, rafraîchis chaque minute.
  useEffect(() => {
    const update = () => setAvailability(getPickupAvailability());
    update();
    const id = window.setInterval(update, 60_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!availability) return;
    if (!availability.asap && availability.slots.length) setPickupMode("SCHEDULED");
    if (slot && !availability.slots.includes(slot)) setSlot("");
  }, [availability]); // eslint-disable-line react-hooks/exhaustive-deps

  const clientErrors = validateCustomer(customer);
  const fieldError = (k: keyof Customer) =>
    serverErrors[k] ?? (touched[k] || submitted ? clientErrors[k] : undefined);
  const slotError = submitted && pickupMode === "SCHEDULED" && !slot ? "Choisissez une heure de retrait." : undefined;
  const closedToday = !!availability && !availability.asap && availability.slots.length === 0;
  const { min, max } = orderingSettings.prepTime;
  const fieldIds = { firstName: `${uid}-prenom`, phone: `${uid}-tel`, email: `${uid}-email` };
  const openStatus = closedToday ? getOpenStatus(restaurant.openingHours) : null;
  const nextOpening = openStatus && !openStatus.open ? openStatus.label.replace(/^Fermé,?\s*(ouvre\s*)?/, "") : "";

  const set = (k: keyof Customer) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomer((c) => ({ ...c, [k]: e.target.value }));
    setServerErrors((s) => ({ ...s, [k]: undefined }));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const firstInvalid = (["firstName", "phone", "email"] as const).find((k) => clientErrors[k]);
    if (firstInvalid) {
      document.getElementById(fieldIds[firstInvalid])?.focus();
      return;
    }
    if (pickupMode === "SCHEDULED" && !slot) {
      document.getElementById(`${uid}-heure`)?.focus();
      return;
    }
    if (closedToday) return;
    setStatus({ type: "loading" });
    const body: CheckoutRequest = {
      items: lines.map((l) => ({ productId: l.productId, options: l.options, quantity: l.quantity, note: l.note })),
      customer,
      pickup: pickupMode === "ASAP" ? { type: "ASAP" } : { type: "SCHEDULED", time: slot },
      fulfillment: "PICKUP",
      note: note.trim() || undefined,
    };
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as CheckoutResponse;
      if (data.ok) {
        // Phase 2 : redirection vers la page de paiement Stripe.
        window.location.assign(data.checkoutUrl);
        return;
      }
      if (data.fieldErrors) setServerErrors(data.fieldErrors);
      if (data.code === "PICKUP_UNAVAILABLE") setAvailability(getPickupAvailability());
      setStatus({ type: "message", tone: data.code === "PAYMENT_UNAVAILABLE" ? "info" : "error", text: data.message });
    } catch {
      setStatus({ type: "message", tone: "error", text: "Connexion impossible. Vérifiez votre réseau puis réessayez." });
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <Step n={1} title="Vos coordonnées">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            id={fieldIds.firstName}
            label="Prénom"
            autoComplete="given-name"
            value={customer.firstName}
            onChange={set("firstName")}
            onBlur={() => setTouched((t) => ({ ...t, firstName: true }))}
            error={fieldError("firstName")}
            hint="Pour vous appeler au comptoir."
          />
          <Field
            id={fieldIds.phone}
            label="Téléphone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={customer.phone}
            onChange={set("phone")}
            onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
            error={fieldError("phone")}
            hint="En cas de question sur la commande."
          />
          <Field
            id={fieldIds.email}
            label="E-mail"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={customer.email}
            onChange={set("email")}
            onBlur={() => setTouched((t) => ({ ...t, email: true }))}
            error={fieldError("email")}
            hint="Pour recevoir la confirmation."
            className="sm:col-span-2"
          />
        </div>
      </Step>

      <Step n={2} title="Retrait">
        <p className="flex gap-3 rounded-2xl bg-cream p-4 text-[15px] text-night">
          <Store className="mt-0.5 size-5 shrink-0 text-royal" aria-hidden="true" />
          <span>
            <strong>Retrait sur place uniquement.</strong> Commande à retirer à La Perle Bleue
            {address ? `, ${address}` : ""}.
          </span>
        </p>

        <div role="radiogroup" aria-label="Heure de retrait" className="mt-5 grid gap-3 sm:grid-cols-2">
          <Choice
            name={`${uid}-retrait`}
            checked={pickupMode === "ASAP"}
            disabled={!availability?.asap}
            onSelect={() => setPickupMode("ASAP")}
            title="Dès que possible"
            text={availability?.asap ? `Prête dans ${min} à ${max} min environ` : "Pendant les heures d'ouverture"}
          />
          <Choice
            name={`${uid}-retrait`}
            checked={pickupMode === "SCHEDULED"}
            disabled={!availability?.slots.length}
            onSelect={() => setPickupMode("SCHEDULED")}
            title="Choisir une heure"
            text={
              availability?.slots.length
                ? `Aujourd'hui, à partir de ${formatSlot(availability.slots[0])}`
                : "Plus de créneau aujourd'hui"
            }
          />
        </div>

        {pickupMode === "SCHEDULED" && !!availability?.slots.length && (
          <div className="mt-5">
            <label htmlFor={`${uid}-heure`} className="block text-[15px] font-semibold text-night">
              Heure de retrait
            </label>
            <select
              id={`${uid}-heure`}
              value={slot}
              required
              onChange={(e) => setSlot(e.target.value)}
              aria-invalid={!!slotError}
              aria-describedby={slotError ? `${uid}-heure-error` : undefined}
              className={cn(
                "mt-2 h-13 w-full rounded-2xl border bg-white px-4 text-base text-night sm:max-w-xs",
                slotError ? "border-[#b42318]" : "border-line",
              )}
            >
              <option value="">Choisir une heure…</option>
              {availability.slots.map((s) => (
                <option key={s} value={s}>
                  Aujourd&apos;hui, {formatSlot(s)}
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

        {closedToday && (
          <p role="status" className="mt-5 flex gap-3 rounded-2xl bg-sand/30 p-4 text-[15px] text-night">
            <Info className="mt-0.5 size-5 shrink-0 text-deep" aria-hidden="true" />
            <span>
              Les commandes en ligne sont fermées pour aujourd&apos;hui.
              {nextOpening && ` Prochaine ouverture : ${nextOpening}.`} Votre panier reste enregistré.
            </span>
          </p>
        )}

        <div className="mt-6">
          <label htmlFor={`${uid}-note`} className="flex items-baseline justify-between gap-3 text-[15px] font-semibold text-night">
            Une précision pour le restaurant&nbsp;?
            <span className="text-xs font-bold tracking-wide text-slate uppercase">Facultatif</span>
          </label>
          <textarea
            id={`${uid}-note`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={300}
            rows={2}
            placeholder="Ex. : couverts, sauces à part…"
            className="mt-2 w-full resize-none rounded-2xl border border-line bg-white px-4 py-3 text-base text-night placeholder:text-slate/70"
          />
        </div>
      </Step>

      <Step n={3} title="Paiement">
        <div className="flex items-start gap-3 rounded-2xl border border-line p-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-royal/10">
            <Lock className="size-5 text-royal" aria-hidden="true" />
          </span>
          <div>
            <p className="font-semibold text-night">Carte bancaire</p>
            <p className="mt-0.5 text-sm text-slate">
              Paiement sécurisé par Stripe. Vos données bancaires ne transitent jamais par notre site.
            </p>
          </div>
        </div>
        <p className="mt-3 flex gap-3 rounded-2xl bg-sand/30 p-4 text-[15px] text-night">
          <Info className="mt-0.5 size-5 shrink-0 text-deep" aria-hidden="true" />
          Le paiement en ligne est en cours d&apos;activation : aucune somme ne sera débitée pour le moment.
        </p>

        {status.type === "message" && (
          <div
            role="alert"
            className={cn(
              "mt-5 flex gap-3 rounded-2xl p-4 text-[15px]",
              status.tone === "error" ? "bg-[#fef3f2] text-[#7a271a]" : "bg-royal/8 text-night",
            )}
          >
            <AlertCircle
              className={cn("mt-0.5 size-5 shrink-0", status.tone === "error" ? ERROR : "text-royal")}
              aria-hidden="true"
            />
            <span>
              {status.text}
              {status.tone === "info" && phoneHref && (
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
          disabled={status.type === "loading" || closedToday}
          className={buttonClasses({ size: "lg", className: "mt-6 min-h-16 w-full text-[15.5px]" })}
        >
          {status.type === "loading" ? (
            <>
              <Loader2 className="size-5 animate-spin" aria-hidden="true" />
              Vérification…
            </>
          ) : (
            <>
              <Lock className="size-[18px]" aria-hidden="true" />
              Payer {formatEuros(subtotal)}
            </>
          )}
        </button>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-sm text-slate">
          <Lock className="size-3.5" aria-hidden="true" />
          Paiement sécurisé · Retrait sur place
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
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-royal font-display text-lg font-extrabold text-white">
          {n}
        </span>
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
        className={cn(
          "mt-2 h-13 w-full rounded-2xl border bg-white px-4 text-base text-night",
          error ? "border-[#b42318]" : "border-line hover:border-night/30",
        )}
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
      <span
        aria-hidden="true"
        className={cn(
          "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2",
          checked ? "border-royal" : "border-night/25",
        )}
      >
        {checked && <span className="size-2.5 rounded-full bg-royal" />}
      </span>
      <span>
        <span className="block font-bold text-night">{title}</span>
        <span className="block text-sm text-slate">{text}</span>
      </span>
    </label>
  );
}
