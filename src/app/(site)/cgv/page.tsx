import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/layout/PageIntro";
import { restaurant } from "@/data/restaurant";
import { fullAddress } from "@/lib/contact";
import { isFilled } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Conditions générales de vente",
  alternates: { canonical: "/cgv" },
};

// TODO(restaurateur) : forme juridique, SIRET, médiateur de la consommation, délai de conservation d'une commande non retirée.
const TODO = "à compléter";

export default function CgvPage() {
  return (
    <>
      <PageIntro title="Conditions générales de vente">Commande en ligne et retrait sur place.</PageIntro>
      <article className="bg-white py-16 text-night lg:py-24">
        <div className="container-x max-w-3xl space-y-10 text-[17px] leading-relaxed text-slate [&_h2]:display [&_h2]:mb-3 [&_h2]:text-4xl [&_h2]:text-deep">
          <section>
            <h2>1. Vendeur</h2>
            <p>
              {restaurant.name} — forme juridique : {TODO} — SIRET : {TODO}
              <br />
              Adresse : {fullAddress ?? TODO}
              <br />
              Téléphone : {isFilled(restaurant.phone) ? restaurant.phone : TODO} — E-mail :{" "}
              {isFilled(restaurant.email) ? restaurant.email : TODO}
            </p>
          </section>
          <section>
            <h2>2. Produits et prix</h2>
            <p>
              Les produits proposés sont ceux de la carte affichée sur le site, dans la limite des disponibilités. Les
              prix sont indiqués en euros toutes taxes comprises. Le prix payé est celui affiché au moment de la
              validation de la commande, options et suppléments compris. Les photos sont non contractuelles.
            </p>
            <p className="mt-3">
              Les informations sur les allergènes sont indiquées sur chaque produit avant la commande, ou disponibles sur
              demande au restaurant.
            </p>
          </section>
          <section>
            <h2>3. Commande</h2>
            <p>
              Le client compose sa commande, indique ses coordonnées et choisit une heure de retrait parmi les créneaux
              proposés, puis paie en ligne. La commande est transmise au restaurant, qui peut l&apos;accepter ou la refuser
              (rupture, affluence, fermeture). Le client est informé par e-mail et peut suivre sa commande en ligne.
            </p>
          </section>
          <section>
            <h2>4. Paiement</h2>
            <p>
              Le paiement par carte bancaire est traité par Mollie, prestataire de paiement agréé ; le restaurant n&apos;a
              jamais accès aux données de carte. Le montant est d&apos;abord autorisé, puis débité au moment où le
              restaurant accepte la commande. En cas de refus, l&apos;autorisation est annulée et aucun montant n&apos;est
              débité ; si un montant a déjà été débité, il est intégralement remboursé.
            </p>
          </section>
          <section>
            <h2>5. Retrait</h2>
            <p>
              La commande est à retirer sur place, au restaurant, à l&apos;heure choisie ou dès qu&apos;elle est prête. Aucune
              livraison n&apos;est proposée. Une commande non retirée est conservée pendant une durée {TODO}, puis
              n&apos;est plus garantie.
            </p>
          </section>
          <section>
            <h2>6. Droit de rétractation</h2>
            <p>
              Conformément à l&apos;article L221-28 du Code de la consommation, le droit de rétractation ne s&apos;applique pas
              aux denrées alimentaires préparées à la demande et susceptibles de se détériorer rapidement. Pour toute
              demande d&apos;annulation avant l&apos;acceptation de la commande, contactez le restaurant par téléphone.
            </p>
          </section>
          <section>
            <h2>7. Réclamations et médiation</h2>
            <p>
              Toute réclamation peut être adressée au restaurant par téléphone ou par e-mail. En cas de litige non résolu,
              le client peut recourir gratuitement au médiateur de la consommation : {TODO}.
            </p>
          </section>
          <section>
            <h2>8. Données personnelles</h2>
            <p>
              Voir la{" "}
              <Link href="/politique-confidentialite" className="font-semibold text-royal underline underline-offset-2">
                politique de confidentialité
              </Link>
              .
            </p>
          </section>
          <section>
            <h2>9. Droit applicable</h2>
            <p>Les présentes conditions sont soumises au droit français.</p>
          </section>
        </div>
      </article>
    </>
  );
}
