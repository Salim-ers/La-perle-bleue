"use client";

import { Loader2, Lock } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Logo } from "@/components/ui/Logo";

export function LoginForm({ next }: { next: string }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        window.location.replace(next);
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "Connexion impossible.");
    } catch {
      setError("Pas de connexion internet.");
    }
    setBusy(false);
  };

  return (
    <form onSubmit={submit} className="w-full max-w-sm rounded-3xl bg-[#131c2e] p-8 ring-1 ring-white/10">
      <Logo className="w-[180px]" />
      <h1 className="mt-6 text-3xl font-bold">Espace cuisine</h1>
      <p className="mt-1 text-white/70">Entrez le mot de passe du restaurant.</p>
      <label htmlFor="password" className="mt-8 block text-lg font-semibold">
        Mot de passe
      </label>
      <input
        id="password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        aria-invalid={!!error}
        aria-describedby={error ? "login-error" : undefined}
        className="mt-2 h-14 w-full rounded-2xl border border-white/20 bg-[#0b1220] px-4 text-xl text-white"
      />
      {error && (
        <p id="login-error" role="alert" className="mt-3 font-semibold text-[#fda29b]">
          {error}
        </p>
      )}
      <button type="submit" disabled={busy || !password} className="mt-6 flex min-h-16 w-full items-center justify-center gap-2 rounded-2xl bg-[#0140b8] text-xl font-bold uppercase disabled:opacity-60">
        {busy ? <Loader2 className="size-6 animate-spin" aria-hidden="true" /> : <Lock className="size-5" aria-hidden="true" />}
        Se connecter
      </button>
    </form>
  );
}
