import { restaurant } from "@/data/restaurant";
import { WEEK } from "@/lib/hours";
import { siteUrl } from "@/lib/site";
import { isFilled } from "@/lib/utils";
import { socials } from "@/lib/contact";

const dayMap = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
} as const;

/** Données structurées : uniquement les informations confirmées. */
export function RestaurantJsonLd() {
  const a = restaurant.address;
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": ["Restaurant", "FoodEstablishment", "LocalBusiness"],
    "@id": `${siteUrl}/#restaurant`,
    name: restaurant.name,
    url: siteUrl,
    image: `${siteUrl}/opengraph-image.jpg`,
    servesCuisine: restaurant.servesCuisine,
    priceRange: restaurant.priceRange,
    hasMenu: `${siteUrl}/menu`,
    acceptsReservations: false,
    openingHoursSpecification: WEEK.flatMap((d) =>
      restaurant.openingHours[d.id].map((r) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: `https://schema.org/${dayMap[d.id]}`,
        opens: r.open,
        closes: r.close,
      })),
    ),
  };
  if (isFilled(a.street) && isFilled(a.city)) {
    data.address = {
      "@type": "PostalAddress",
      streetAddress: a.street,
      ...(isFilled(a.postalCode) ? { postalCode: a.postalCode } : {}),
      addressLocality: a.city,
      addressCountry: a.country,
    };
  }
  if (isFilled(restaurant.phone)) data.telephone = restaurant.phone;
  if (isFilled(restaurant.email)) data.email = restaurant.email;
  if (socials.length) data.sameAs = socials.map((s) => s.url);
  if (restaurant.googleRating && restaurant.googleReviewCount) {
    data.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: restaurant.googleRating,
      reviewCount: restaurant.googleReviewCount,
    };
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
