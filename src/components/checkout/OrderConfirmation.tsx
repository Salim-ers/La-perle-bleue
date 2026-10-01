import { CheckCircle2, Clock, Store } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { formatSlot } from "@/features/order/pickup";
import { ORDER_STATUS_LABELS, PAID_STATUSES, type Order } from "@/features/order/types";
import { formatEuros } from "@/lib/money";
import { ClearCartOnPaid } from "./ClearCartOnPaid";

/**
 * Confirmation de commande. N'affiche « Commande confirmée » QUE pour une
 * commande dont le statut (posé par le webhook Stripe) prouve le paiement.
 * Arriver sur cette page après la redirection Stripe ne prouve rien.
 */
export function OrderConfirmation({ order, phoneHref }: { order: Order | null; phoneHref: string | null }) {
  if (!order) {
    return (
      <Shell title="Commande introuvable.">
        <p className="mt-4 max-w-[46ch] text-lg text-slate">
          Nous ne retrouvons pas de commande à afficher. Si vous venez de payer, la confirmation peut
          prendre quelques instants : actualisez la page.
        </p>
        <Actions phoneHref={phoneHref} />
      </Shell>
    );
  }

  const paid = PAID_STATUSES.includes(order.status);
  if (!paid) {
    return (
      <Shell title={order.status === "CANCELLED" ? "Commande annulée." : "Paiement en cours de vérification."}>
        <p className="mt-4 max-w-[46ch] text-lg text-slate">
          {order.status === "CANCELLED"
            ? "Cette commande a été annulée. Aucun montant n'a été conservé."
            : "Nous attendons la confirmation de votre banque. Cette page se met à jour dès qu'elle arrive."}
        </p>
        <Actions phoneHref={phoneHref} />
      </Shell>
    );
  }

  return (
    <Shell title="Commande confirmée" icon>
      <ClearCartOnPaid />
      <dl className="mt-8 grid gap-4 rounded-[22px] bg-white p-6 ring-1 ring-line sm:grid-cols-2">
        <Item label="Numéro de commande" value={order.number} strong />
        <Item label="Montant payé" value={formatEuros(order.total)} strong />
        <Item
          label="Retrait"
          value={order.pickup.type === "ASAP" ? "Dès que possible" : `Aujourd'hui, ${formatSlot(order.pickup.time)}`}
        />
        <Item label="Statut" value={ORDER_STATUS_LABELS[order.status]} />
      </dl>
      <p className="mt-6 flex items-center gap-2 text-slate">
        <Store className="size-5 text-royal" aria-hidden="true" />
        Commande à retirer à La Perle Bleue. Donnez votre prénom au comptoir.
      </p>
      <Actions phoneHref={phoneHref} />
    </Shell>
  );
}

function Shell({ title, icon, children }: { title: string; icon?: boolean; children: React.ReactNode }) {
  return (
    <div className="container-x max-w-3xl py-14 lg:py-24">
      {icon ? (
        <CheckCircle2 className="size-14 text-leaf" aria-hidden="true" />
      ) : (
        <Clock className="size-12 text-royal" aria-hidden="true" />
      )}
      <h1 className="display mt-6 text-[clamp(3rem,8vw,5.4rem)] text-deep">{title}</h1>
      {children}
    </div>
  );
}

function Item({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div>
      <dt className="text-sm text-slate">{label}</dt>
      <dd className={strong ? "font-display text-3xl font-extrabold text-night" : "text-lg font-semibold text-night"}>
        {value}
      </dd>
    </div>
  );
}

function Actions({ phoneHref }: { phoneHref: string | null }) {
  return (
    <div className="mt-10 flex flex-wrap gap-3">
      <ButtonLink href="/menu">Voir la carte</ButtonLink>
      <ButtonLink href={phoneHref} variant="outline-dark">
        Appeler le restaurant
      </ButtonLink>
      <ButtonLink href="/" variant="outline-dark">
        Accueil
      </ButtonLink>
    </div>
  );
}
