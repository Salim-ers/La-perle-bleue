import type { Metadata } from "next";
import { PageIntro } from "@/components/layout/PageIntro";
import { restaurant } from "@/data/restaurant";
import { fullAddress } from "@/lib/contact";
import { isFilled } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Mentions légales",
  alternates: { canonical: "/mentions-legales" },
  robots: { index: false },
};

const TODO = "Informations à compléter";

export default function MentionsLegales() {
  return (
    <>
      <PageIntro title="Mentions légales" />
      <article className="bg-white py-16 text-night lg:py-24">
        <div className="container-x max-w-3xl space-y-10 text-[17px] leading-relaxed text-slate [&_h2]:display [&_h2]:mb-3 [&_h2]:text-4xl [&_h2]:text-deep">
          <section>
            <h2>Éditeur du site</h2>
            <p>
              {restaurant.name}
              <br />
              Forme juridique et capital : {TODO}
              <br />
              Adresse : {fullAddress ?? TODO}
              <br />
              SIRET : {TODO}
              <br />
              Téléphone : {isFilled(restaurant.phone) ? restaurant.phone : TODO}
              <br />
              E-mail : {isFilled(restaurant.email) ? restaurant.email : TODO}
              <br />
              Directeur de la publication : {TODO}
            </p>
          </section>
          <section>
            <h2>Hébergement</h2>
            <p>
              Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis.
              <br />
              Site : vercel.com
            </p>
          </section>
          <section>
            <h2>Propriété intellectuelle</h2>
            <p>
              Le logo, les photographies et les textes de ce site sont la propriété de{" "}
              {restaurant.name} ou utilisés avec l&apos;accord de leurs auteurs. Toute reproduction
              sans autorisation est interdite.
            </p>
          </section>
          <section>
            <h2>Prix et informations</h2>
            <p>
              Les prix et la composition des produits sont donnés à titre indicatif et peuvent
              évoluer. Seuls les prix affichés au restaurant font foi.
            </p>
          </section>
        </div>
      </article>
    </>
  );
}
