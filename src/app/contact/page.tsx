import type { Metadata } from "next";
import { VisitUs } from "@/components/info/VisitUs";
import { city } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact, horaires et accès",
  description: `Adresse, téléphone, horaires et itinéraire pour venir à La Perle Bleue${city ? ` à ${city}` : ""}.`,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <div className="pt-[var(--header-h)]">
      <div className="bg-night h-6 lg:h-10" aria-hidden="true" />
      <VisitUs headingLevel="h1" />
    </div>
  );
}
