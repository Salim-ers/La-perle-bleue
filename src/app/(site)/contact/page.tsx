import type { Metadata } from "next";
import { RestaurantInfo } from "@/components/info/RestaurantInfo";
import { city } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact, horaires et accès",
  description: `Adresse, téléphone, horaires et itinéraire pour venir à La Perle Bleue${city ? ` à ${city}` : ""}.`,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <div className="pt-[var(--header-h)]">
      <RestaurantInfo headingLevel="h1" />
    </div>
  );
}
