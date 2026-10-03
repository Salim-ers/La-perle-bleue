"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { KitchenSnapshot } from "@/features/kitchen/types";
import type { KitchenAction, RefusalReason } from "@/features/order/types";

const POLL_MS = 3000;

/**
 * Commandes cuisine par interrogation régulière (pas de WebSocket) :
 * GET /api/kitchen/orders toutes les 3 s, nouvel essai automatique si le réseau tombe.
 */
export function useKitchenOrders() {
  const [snapshot, setSnapshot] = useState<KitchenSnapshot | null>(null);
  const [online, setOnline] = useState(true);
  const [lastSync, setLastSync] = useState<number | null>(null);
  const inFlight = useRef(false);

  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const res = await fetch("/api/kitchen/orders", { cache: "no-store" });
      if (res.status === 401) {
        window.location.replace("/admin/login?suite=/admin/cuisine");
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      setSnapshot((await res.json()) as KitchenSnapshot);
      setOnline(true);
      setLastSync(Date.now());
    } catch {
      setOnline(false);
    } finally {
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    void refresh();
    const id = window.setInterval(refresh, POLL_MS);
    const onVisible = () => document.visibilityState === "visible" && void refresh();
    window.addEventListener("online", refresh);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("online", refresh);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  return { snapshot, online, lastSync, refresh };
}

/** Action cuisine. Renvoie un message d'erreur ou null. */
export async function sendKitchenAction(orderId: string, action: KitchenAction, reason?: RefusalReason) {
  try {
    const res = await fetch(`/api/kitchen/orders/${orderId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reason }),
    });
    if (res.ok) return null;
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    return data.error ?? "Action impossible.";
  } catch {
    return "Pas de connexion. Réessayez.";
  }
}

/**
 * Sonnerie générée par le navigateur (aucun fichier audio). Doit être
 * « débloquée » par un geste (bouton « Démarrer le service »).
 */
export function useAlarm(ringing: boolean) {
  const ctx = useRef<AudioContext | null>(null);
  const [unlocked, setUnlocked] = useState(false);

  const unlock = useCallback(() => {
    try {
      ctx.current ??= new AudioContext();
      void ctx.current.resume();
      setUnlocked(true);
    } catch {
      setUnlocked(false);
    }
  }, []);

  useEffect(() => {
    const audio = ctx.current;
    if (!ringing || !unlocked || !audio) return;
    const ring = () => {
      const start = audio.currentTime;
      [0, 0.22, 0.44].forEach((offset, i) => {
        const osc = audio.createOscillator();
        const gain = audio.createGain();
        osc.type = "square";
        osc.frequency.value = i === 1 ? 880 : 1320;
        gain.gain.setValueAtTime(0.0001, start + offset);
        gain.gain.exponentialRampToValueAtTime(0.35, start + offset + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + offset + 0.18);
        osc.connect(gain).connect(audio.destination);
        osc.start(start + offset);
        osc.stop(start + offset + 0.2);
      });
    };
    ring();
    const id = window.setInterval(ring, 2500);
    return () => window.clearInterval(id);
  }, [ringing, unlocked]);

  return { unlocked, unlock };
}

/** Garde l'écran de la tablette allumé pendant le service (si le navigateur le permet). */
export function useWakeLock(enabled: boolean) {
  useEffect(() => {
    if (!enabled || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    const acquire = async () => {
      try {
        lock = await navigator.wakeLock.request("screen");
      } catch {
        // batterie faible ou refus : l'écran suivra le réglage de la tablette
      }
    };
    void acquire();
    const onVisible = () => document.visibilityState === "visible" && void acquire();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      void lock?.release().catch(() => {});
    };
  }, [enabled]);
}
