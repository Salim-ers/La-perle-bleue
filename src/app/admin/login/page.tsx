import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/admin/LoginForm";

export const metadata: Metadata = { title: "Connexion" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ suite?: string }> }) {
  const { suite } = await searchParams;
  // Retour uniquement vers une page de l'admin (pas de redirection ouverte).
  const next = suite && suite.startsWith("/admin/") && !suite.startsWith("//") ? suite : "/admin/cuisine";
  // Avant la mise en service, les vraies commandes ne peuvent pas encore arriver : on indique la démo.
  const setup = !process.env.DATABASE_URL;
  return (
    <main className="grid min-h-svh place-items-center gap-6 p-6">
      <div className="w-full max-w-sm">
        <LoginForm next={next} />
        {setup && (
          <p className="mt-4 rounded-2xl bg-white/5 p-4 text-center text-white/80 ring-1 ring-white/10">
            Commandes en ligne pas encore branchées.{" "}
            <Link href="/demo/cuisine" className="font-bold text-white underline underline-offset-2">
              Ouvrir la cuisine de démonstration
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}
