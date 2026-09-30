import { restaurant } from "@/data/restaurant";
import { reviews } from "@/data/reviews";
import { isFilled } from "./utils";

const a = restaurant.address;

export const hasAddress = isFilled(a.street) && isFilled(a.city);

export const fullAddress = hasAddress
  ? `${a.street}, ${isFilled(a.postalCode) ? a.postalCode + " " : ""}${a.city}`
  : null;

export const shortAddress = hasAddress ? `${a.street}, ${a.city}` : null;

/** Lien d'itinéraire : fiche Google si connue, sinon destination par adresse. */
export const directionsHref: string | null = isFilled(restaurant.googleMapsUrl)
  ? restaurant.googleMapsUrl
  : fullAddress
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
        `${restaurant.name}, ${fullAddress}`,
      )}`
    : null;

export const mapEmbedSrc: string | null = fullAddress
  ? `https://www.google.com/maps?q=${encodeURIComponent(
      `${restaurant.name}, ${fullAddress}`,
    )}&output=embed`
  : null;

export const phoneHref = isFilled(restaurant.phone)
  ? `tel:${restaurant.phone.replace(/[^\d+]/g, "")}`
  : null;

export const emailHref = isFilled(restaurant.email) ? `mailto:${restaurant.email}` : null;

export const reviewsHref = isFilled(restaurant.googleReviewsUrl)
  ? restaurant.googleReviewsUrl
  : null;

export const showReviews = reviews.length > 0 || !!reviewsHref;

export const socials = (
  [
    ["Instagram", restaurant.socialLinks.instagram],
    ["Facebook", restaurant.socialLinks.facebook],
    ["TikTok", restaurant.socialLinks.tiktok],
  ] as const
)
  .filter(([, url]) => isFilled(url))
  .map(([label, url]) => ({ label, url }));
