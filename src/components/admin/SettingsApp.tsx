"use client";

import Link from "next/link";
import { ArrowLeft, Loader2, LogOut, Minus, Plus, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

interface Settings {
  ordersEnabled: boolean;
  preparationDelay: number;
  maxOrdersPerSlot: number;
}
interface Availability {
  unavailableProducts: string[];
  unavailableOptions: string[];
}
interface Item {
  id: string;
  name: string;
  group: string;
}

/** Réglages du restaurant : pause, délai de préparation, capacité, ruptures. Grandes zones tactiles. */
export function SettingsApp({ products, options, delays }: { products: Item[]; options: Item[]; delays: number[] }) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    try {
      const [s, a] = await Promise.all([fetch("/api/admin/settings", { cache: "no-store" }), fetch("/api/admin/availability", { cache: "no-store" })]);
      if (s.status === 401 || a.status === 401) return window.location.replace("/admin/login?suite=/admin/reglages");
      setSettings(await s.json());
      setAvailability(await a.json());
    } catch {
      setError("Pas de connexion. Réessayez.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const patch = async (key: string, body: Partial<Settings>) => {
    setPending(key);
    setError(null);
    try {
      const res = await fetch("/api/admin/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error();
      setSettings(await res.json());
    } catch {
      setError("Réglage non enregistré. Réessayez.");
    }
    setPending(null);
  };

  const toggleItem = async (type: "product" | "option", itemId: string, available: boolean) => {
    setPending(`${type}:${itemId}`);
    setError(null);
    try {
      const res = await fetch("/api/admin/availability", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, itemId, available }) });
      if (!res.ok) throw new Error();
      setAvailability(await res.json());
    } catch {
      setError("Rupture non enregistrée. Réessayez.");
    }
    setPending(null);
  };

  const filter = useCallback(
    (list: Item[]) => {
      const q = query.trim().toLowerCase();
      return q ? list.filter((i) => `${i.name} ${i.group}`.toLowerCase().includes(q)) : list;
    },
    [query],
  );
  const groups = useMemo(() => {
    const all = [...filter(products).map((p) => ({ ...p, type: "product" as const })), ...filter(options).map((o) => ({ ...o, type: "option" as const }))];
    const map = new Map<string, typeof all>();
    for (const item of all) map.set(item.group, [...(map.get(item.group) ?? []), item]);
    return [...map.entries()];
  }, [products, options, filter]);

  return (
    <main className="mx-auto max-w-4xl p-4 pb-16 sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/cuisine" className="flex min-h-12 items-center gap-2 rounded-full bg-white/10 px-4 text-lg font-bold">
          <ArrowLeft className="size-5" aria-hidden="true" /> Commandes
        </Link>
        <button
          type="button"
          onClick={async () => {
            await fetch("/api/admin/logout", { method: "POST" });
            window.location.replace("/admin/login");
          }}
          className="flex min-h-12 items-center gap-2 rounded-full bg-white/10 px-4 text-lg font-bold"
        >
          <LogOut className="size-5" aria-hidden="true" /> Se déconnecter
        </button>
      </header>
      <h1 className="mt-6 text-4xl font-black">Réglages</h1>

      {error && (
        <p role="alert" className="mt-4 rounded-2xl bg-[#f04438] px-4 py-3 text-lg font-bold">
          {error}
        </p>
      )}

      {!settings || !availability ? (
        <p className="mt-10 flex items-center gap-3 text-xl text-white/70">
          <Loader2 className="size-6 animate-spin" aria-hidden="true" /> Chargement…
        </p>
      ) : (
        <>
          <section className="mt-6 rounded-3xl bg-[#131c2e] p-5 ring-1 ring-white/10">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black">Accepter les commandes</h2>
                <p className="mt-1 text-lg text-white/70">
                  {settings.ordersEnabled ? "Les clients peuvent commander en ligne." : "Le site affiche « Commandes temporairement suspendues »."}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.ordersEnabled}
                aria-label="Accepter les commandes"
                disabled={pending === "orders"}
                onClick={() => patch("orders", { ordersEnabled: !settings.ordersEnabled })}
                className={cn("relative h-14 w-28 shrink-0 rounded-full transition-colors", settings.ordersEnabled ? "bg-[#12b76a]" : "bg-[#f04438]")}
              >
                <span className={cn("absolute top-1.5 size-11 rounded-full bg-white transition-all", settings.ordersEnabled ? "left-[3.75rem]" : "left-1.5")} />
                <span className="sr-only">{settings.ordersEnabled ? "Activé" : "Désactivé"}</span>
              </button>
            </div>
            <p className={cn("mt-3 text-2xl font-black", settings.ordersEnabled ? "text-[#6ce9a6]" : "text-[#fda29b]")}>
              {settings.ordersEnabled ? "ON" : "OFF"}
            </p>
          </section>

          <section className="mt-4 rounded-3xl bg-[#131c2e] p-5 ring-1 ring-white/10">
            <h2 className="text-2xl font-black">Temps de préparation</h2>
            <p className="mt-1 text-lg text-white/70">Affiché aux clients et utilisé pour l&apos;heure de retrait.</p>
            <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
              {delays.map((d) => (
                <button
                  key={d}
                  type="button"
                  aria-pressed={settings.preparationDelay === d}
                  disabled={pending === "delay"}
                  onClick={() => patch("delay", { preparationDelay: d })}
                  className={cn(
                    "min-h-16 rounded-2xl text-2xl font-black",
                    settings.preparationDelay === d ? "bg-white text-[#0b1220]" : "bg-white/10",
                  )}
                >
                  {d} min
                </button>
              ))}
            </div>
          </section>

          <section className="mt-4 rounded-3xl bg-[#131c2e] p-5 ring-1 ring-white/10">
            <h2 className="text-2xl font-black">Commandes maximum par créneau de 15 min</h2>
            <div className="mt-4 flex items-center gap-4">
              <button
                type="button"
                aria-label="Diminuer"
                disabled={settings.maxOrdersPerSlot <= 1 || pending === "slot"}
                onClick={() => patch("slot", { maxOrdersPerSlot: settings.maxOrdersPerSlot - 1 })}
                className="grid size-16 place-items-center rounded-2xl bg-white/10 disabled:opacity-40"
              >
                <Minus className="size-7" aria-hidden="true" />
              </button>
              <output className="w-16 text-center text-4xl font-black tabular-nums">{settings.maxOrdersPerSlot}</output>
              <button
                type="button"
                aria-label="Augmenter"
                disabled={pending === "slot"}
                onClick={() => patch("slot", { maxOrdersPerSlot: settings.maxOrdersPerSlot + 1 })}
                className="grid size-16 place-items-center rounded-2xl bg-white/10"
              >
                <Plus className="size-7" aria-hidden="true" />
              </button>
            </div>
          </section>

          <section className="mt-4 rounded-3xl bg-[#131c2e] p-5 ring-1 ring-white/10">
            <h2 className="text-2xl font-black">Ruptures</h2>
            <p className="mt-1 text-lg text-white/70">Un produit ou une option en rupture ne peut plus être commandé, immédiatement.</p>
            <label className="mt-4 flex items-center gap-3 rounded-2xl bg-[#0b1220] px-4 ring-1 ring-white/15">
              <Search className="size-5 text-white/60" aria-hidden="true" />
              <span className="sr-only">Rechercher</span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher : kebab, tenders, coca…"
                className="h-14 w-full bg-transparent text-lg text-white placeholder:text-white/40 focus:outline-none"
              />
            </label>
            {groups.map(([group, items]) => (
              <div key={group} className="mt-6">
                <h3 className="text-lg font-bold tracking-wide text-white/60 uppercase">{group}</h3>
                <ul className="mt-2 divide-y divide-white/10">
                  {items.map((item) => {
                    const off = item.type === "product" ? availability.unavailableProducts.includes(item.id) : availability.unavailableOptions.includes(item.id);
                    const key = `${item.type}:${item.id}`;
                    return (
                      <li key={key} className="flex min-h-16 items-center justify-between gap-4 py-2">
                        <span className={cn("text-xl font-bold", off && "text-white/50 line-through")}>{item.name}</span>
                        <button
                          type="button"
                          disabled={pending === key}
                          onClick={() => toggleItem(item.type, item.id, off)}
                          className={cn("min-h-12 min-w-36 rounded-full px-4 text-lg font-black uppercase", off ? "bg-[#f04438]" : "bg-[#12b76a]/20 text-[#6ce9a6]")}
                        >
                          {pending === key ? "…" : off ? "Rupture" : "Disponible"}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </section>
        </>
      )}
    </main>
  );
}
