import type { Metadata } from "next";
import { LoginForm } from "@/components/admin/LoginForm";

export const metadata: Metadata = { title: "Connexion" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ suite?: string }> }) {
  const { suite } = await searchParams;
  // Retour uniquement vers une page de l'admin (pas de redirection ouverte).
  const next = suite && suite.startsWith("/admin/") && !suite.startsWith("//") ? suite : "/admin/cuisine";
  return (
    <main className="grid min-h-svh place-items-center p-6">
      <LoginForm next={next} />
    </main>
  );
}
