/**
 * Avis Google. N'ajouter QUE de vrais avis, copiés depuis la fiche Google,
 * avec l'accord de principe du restaurateur. Tant que la liste est vide et que
 * `googleReviewsUrl` n'est pas renseigné, la section « Avis » est masquée.
 */
export interface Review {
  author: string; // prénom ou initiale
  rating: 1 | 2 | 3 | 4 | 5;
  text: string;
  date?: string; // ISO, ex. "2026-08-14"
}

export const reviews: Review[] = [];
