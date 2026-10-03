import type { Metadata } from "next";
import { DemoTracker } from "./DemoTracker";

export const metadata: Metadata = { title: "Suivi de commande (démonstration)", robots: { index: false, follow: false } };

export default async function DemoSuiviPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="min-h-[80svh] bg-cream pt-[var(--header-h)]">
      <DemoTracker id={id} />
    </div>
  );
}
