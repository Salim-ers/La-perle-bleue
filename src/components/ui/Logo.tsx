import Image from "next/image";
import logoBlanc from "@/assets/brand/logo-blanc.png";
import logoBleu from "@/assets/brand/logo-bleu.png";
import { cn } from "@/lib/utils";

/**
 * Logo extrait de la photo du mur (détourage). À remplacer par le fichier
 * vectoriel officiel : src/assets/brand/logo-blanc.png / logo-bleu.png.
 */
export function Logo({
  variant = "light",
  className,
  priority,
  sizes = "(min-width: 1024px) 200px, 160px",
}: {
  variant?: "light" | "dark";
  className?: string;
  priority?: boolean;
  /** Largeur d'affichage, pour charger une version assez nette. */
  sizes?: string;
}) {
  return (
    <Image
      src={variant === "light" ? logoBlanc : logoBleu}
      alt="La Perle Bleue"
      className={cn("h-auto", className)}
      sizes={sizes}
      priority={priority}
    />
  );
}
