import type { Metadata } from "next";
import { PageIntro } from "@/components/layout/PageIntro";
import { restaurant } from "@/data/restaurant";
import { isFilled } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  alternates: { canonical: "/politique-confidentialite" },
  robots: { index: false },
};

export default function Confidentialite() {
  const contact = isFilled(restaurant.email) ? restaurant.email : "Informations à compléter";
  return (
    <>
      <PageIntro title="Confidentialité" />
      <article className="bg-white py-16 text-night lg:py-24">
        <div className="container-x max-w-3xl space-y-10 text-[17px] leading-relaxed text-slate [&_h2]:display [&_h2]:mb-3 [&_h2]:text-4xl [&_h2]:text-deep">
          <section>
            <h2>Données collectées</h2>
            <p>
              Ce site est une vitrine : il ne propose ni compte client, ni formulaire, ni commande
              en ligne. Aucune donnée personnelle n&apos;est collectée directement par le site.
            </p>
            <p className="mt-3">
              L&apos;hébergeur conserve des journaux techniques (adresse IP, date, page demandée)
              nécessaires à la sécurité et au bon fonctionnement du service.
            </p>
          </section>
          <section id="cookies" className="scroll-mt-32">
            <h2>Cookies</h2>
            <p>
              Le site ne dépose aucun cookie publicitaire ni de mesure d&apos;audience. La carte
              Google Maps n&apos;est chargée que si vous cliquez sur « Afficher la carte » : Google
              peut alors déposer ses propres cookies, selon sa politique de confidentialité.
            </p>
          </section>
          <section>
            <h2>Vos droits</h2>
            <p>
              Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de rectification et
              d&apos;effacement de vos données. Contact : {contact}. Vous pouvez aussi saisir la
              CNIL (cnil.fr).
            </p>
          </section>
        </div>
      </article>
    </>
  );
}
