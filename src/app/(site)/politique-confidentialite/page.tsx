import type { Metadata } from "next";
import { PageIntro } from "@/components/layout/PageIntro";
import { restaurant } from "@/data/restaurant";
import { isFilled } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  alternates: { canonical: "/politique-confidentialite" },
  robots: { index: false },
};

// TODO(restaurateur) : valider les durées de conservation et la région Neon (Union européenne).
const RETENTION =
  "commandes et pièces comptables : 10 ans (obligation comptable) ; coordonnées : 3 ans après la dernière commande (durées à valider par le restaurant)";

export default function Confidentialite() {
  const contact = isFilled(restaurant.email) ? restaurant.email : "Informations à compléter";
  return (
    <>
      <PageIntro title="Confidentialité" />
      <article className="bg-white py-16 text-night lg:py-24">
        <div className="container-x max-w-3xl space-y-10 text-[17px] leading-relaxed text-slate [&_h2]:display [&_h2]:mb-3 [&_h2]:text-4xl [&_h2]:text-deep">
          <section>
            <h2>Commande en ligne</h2>
            <p>
              Pour traiter une commande, nous collectons votre prénom, votre nom, votre téléphone, votre e-mail, le contenu
              de la commande et l&apos;heure de retrait. Ces données servent uniquement à préparer la commande, à vous
              informer de son avancement par e-mail et à vous joindre en cas de besoin. Base légale : exécution de la
              commande.
            </p>
            <p className="mt-3">Durée de conservation : {RETENTION}.</p>
            <p className="mt-3">Prestataires techniques (sous-traitants) :</p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>Mollie (paiement) : les données de carte sont saisies chez Mollie, jamais sur ce site ;</li>
              <li>Neon (base de données des commandes) ;</li>
              <li>Resend (envoi des e-mails de commande) ;</li>
              <li>Vercel (hébergement du site).</li>
            </ul>
            <p className="mt-3">
              L&apos;hébergeur conserve des journaux techniques (adresse IP, date, page demandée) nécessaires à la sécurité et
              au bon fonctionnement du service.
            </p>
          </section>
          <section id="cookies" className="scroll-mt-32">
            <h2>Cookies et stockage local</h2>
            <p>
              Le site ne dépose aucun cookie publicitaire ni de mesure d&apos;audience. Votre panier est enregistré dans votre
              navigateur (stockage local) pour ne pas être perdu, puis effacé après 24 heures. L&apos;espace cuisine du
              restaurant utilise un cookie de connexion. Ces éléments sont strictement nécessaires au service.
            </p>
            <p className="mt-3">
              La carte Google Maps n&apos;est chargée que si vous cliquez sur « Afficher la carte » : Google peut alors déposer
              ses propres cookies, selon sa politique de confidentialité.
            </p>
          </section>
          <section>
            <h2>Vos droits</h2>
            <p>
              Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de rectification et d&apos;effacement de vos
              données. Contact : {contact}. Vous pouvez aussi saisir la CNIL (cnil.fr).
            </p>
          </section>
        </div>
      </article>
    </>
  );
}
