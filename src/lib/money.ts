/**
 * Montants transactionnels (panier, commande, paiement) : 1850 -> "18,50 €".
 * La carte garde le style du tableau du restaurant (« 18€50 », voir formatPrice).
 * Formatage manuel pour un rendu identique côté serveur et navigateur.
 */
export function formatEuros(cents: number) {
  const abs = Math.abs(Math.round(cents));
  const euros = Math.floor(abs / 100)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, "\u202f");
  return `${cents < 0 ? "−" : ""}${euros},${String(abs % 100).padStart(2, "0")}\u00a0€`;
}

/** Supplément d'option : 50 -> "+0,50 €", 0 -> "". */
export const formatDelta = (cents: number) => (cents ? `+${formatEuros(cents)}` : "");
