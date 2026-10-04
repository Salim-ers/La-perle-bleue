import { cn } from "@/lib/utils";

const ARABIC_FONTS = "'Noto Naskh Arabic', 'Geeza Pro', 'Segoe UI', Tahoma, Arial, sans-serif";

/**
 * Logo « Halal » de la carte, dans le bleu de l'enseigne.
 * `compact` : sans le texte circulaire, lisible en petite taille (mobile).
 * `id` : à changer si deux logos complets sont affichés sur la même page (chemin du texte circulaire).
 */
export function HalalBadge({ className, compact = false, id = "halal-arc" }: { className?: string; compact?: boolean; id?: string }) {
  return (
    <svg viewBox="0 0 200 200" role="img" aria-label="Viande halal" className={cn("shrink-0", className)}>
      <circle cx="100" cy="100" r="100" fill="#fff" />
      <circle cx="100" cy="100" r="93" fill="#0140b8" />
      {compact ? (
        <>
          <circle cx="100" cy="100" r="80" fill="#fff" />
          <text x="100" y="104" textAnchor="middle" fill="#0140b8" fontSize="58" fontWeight="700" fontFamily={ARABIC_FONTS}>
            حلال
          </text>
          <text x="100" y="152" textAnchor="middle" fill="#0140b8" fontSize="36" letterSpacing="2" style={{ fontFamily: "var(--font-display)" }}>
            HALAL
          </text>
        </>
      ) : (
        <>
          <path id={id} d="M 100,100 m -73,0 a 73,73 0 1,1 146,0 a 73,73 0 1,1 -146,0" fill="none" />
          <text fill="#fff" fontSize="15" fontWeight="700" letterSpacing="3" style={{ fontFamily: "var(--font-sans)" }}>
            <textPath href={`#${id}`} textLength="452" lengthAdjust="spacing">
              VIANDE HALAL • VIANDE HALAL •
            </textPath>
          </text>
          <circle cx="100" cy="100" r="57" fill="#fff" />
          <circle cx="100" cy="100" r="51" fill="none" stroke="#8cc8f2" strokeWidth="2" />
          <text x="100" y="102" textAnchor="middle" fill="#0140b8" fontSize="40" fontWeight="700" fontFamily={ARABIC_FONTS}>
            حلال
          </text>
          <text x="100" y="132" textAnchor="middle" fill="#0140b8" fontSize="25" letterSpacing="2" style={{ fontFamily: "var(--font-display)" }}>
            HALAL
          </text>
        </>
      )}
    </svg>
  );
}
