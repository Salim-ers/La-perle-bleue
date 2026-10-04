import { ShoppingBag } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";

/** « Votre panier a faim. » : tiroir panier et page de commande. */
export function EmptyCart({ onNavigate, headingLevel = "h2" }: { onNavigate?: () => void; headingLevel?: "h1" | "h2" }) {
  const Heading = headingLevel;
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span className="grid size-24 place-items-center rounded-full bg-paper ring-8 ring-paper/50">
        <ShoppingBag className="size-10 text-royal" strokeWidth={1.75} aria-hidden="true" />
      </span>
      <Heading className="display mt-8 text-[2.8rem] text-deep">Votre panier a faim.</Heading>
      <p className="mt-3 max-w-[30ch] text-slate">
        Un kebab, un tacos ou une assiette grillée&nbsp;? On s&apos;occupe du reste.
      </p>
      <ButtonLink href="/menu" size="lg" className="mt-8" onClick={onNavigate}>
        Voir la carte
      </ButtonLink>
    </div>
  );
}
