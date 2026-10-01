import { Star } from "lucide-react";
import { restaurant } from "@/data/restaurant";
import type { Review } from "@/data/reviews";
import { ButtonLink } from "@/components/ui/Button";

function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span className={className} role="img" aria-label={`${value} sur 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          aria-hidden="true"
          className={`inline size-4 ${i < Math.round(value) ? "fill-sand text-sand" : "text-white/25"}`}
        />
      ))}
    </span>
  );
}

/** Affiche uniquement de vrais avis. Section masquée s'il n'y a ni avis ni lien. */
export function Reviews({ reviews, reviewsHref }: { reviews: Review[]; reviewsHref: string | null }) {
  const { googleRating: rating, googleReviewCount: count } = restaurant;
  return (
    <section id="avis" aria-labelledby="avis-title" className="grain on-dark bg-night py-20 lg:py-28">
      <div className="container-x">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h2 id="avis-title" className="display text-[clamp(2.8rem,6vw,4.6rem)] text-white">
              Ils parlent de nous.
            </h2>
            {rating && count && (
              <p className="mt-4 flex items-center gap-3 text-fog">
                <Stars value={rating} />
                <span>
                  <strong className="text-white">{rating.toLocaleString("fr-FR")}</strong> sur Google,{" "}
                  {count} avis
                </span>
              </p>
            )}
          </div>
          <ButtonLink href={reviewsHref} variant="ghost">
            Voir tous les avis Google
          </ButtonLink>
        </div>
        {reviews.length > 0 && (
          <ul className="mt-12 grid gap-8 md:grid-cols-3">
            {reviews.slice(0, 3).map((r, i) => (
              <li key={i} className="border-t border-white/15 pt-6">
                <Stars value={r.rating} />
                <blockquote className="mt-4 text-lg leading-relaxed text-white/90">« {r.text} »</blockquote>
                <p className="mt-4 text-sm text-fog">
                  {r.author}
                  {r.date &&
                    `, ${new Date(r.date).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}`}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
