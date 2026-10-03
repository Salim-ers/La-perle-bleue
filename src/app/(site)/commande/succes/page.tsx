import { redirect } from "next/navigation";

/** Ancienne adresse de confirmation : redirige vers le suivi de commande. */
export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ commande?: string }> }) {
  const { commande } = await searchParams;
  redirect(commande && /^[0-9a-f-]{36}$/i.test(commande) ? `/suivi/${commande}` : "/menu");
}
