import { formatPrice, spokenPrice } from "@/data/menu";
import { cn } from "@/lib/utils";

/** Pastille ronde cerclée de bleu, reprise de la carte du restaurant. */
export function PriceBadge({
  cents,
  size = "md",
  className,
}: {
  cents: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const s = {
    sm: "size-12 text-[15px] border-[2.5px]",
    md: "size-[60px] text-lg border-[3px]",
    lg: "size-[72px] text-[22px] border-[3.5px]",
  }[size];
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-full border-royal bg-white font-display font-extrabold leading-none text-night tabular-nums",
        s,
        className,
      )}
    >
      <span aria-hidden="true">{formatPrice(cents)}</span>
      <span className="sr-only">{spokenPrice(cents)}</span>
    </span>
  );
}
