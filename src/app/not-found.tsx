import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";

/** Page 404 globale (hors layout du site : elle porte son propre logo). */
export default function NotFound() {
  return (
    <main className="grain on-dark flex min-h-svh flex-col bg-night">
      <div className="container-x pt-6">
        <Link href="/" aria-label="La Perle Bleue, accueil" className="inline-block">
          <Logo className="w-[150px]" />
        </Link>
      </div>
      <section className="container-x flex flex-1 flex-col justify-center pb-20">
        <h1 className="display text-[clamp(3.4rem,10vw,7rem)] text-white">Page introuvable.</h1>
        <p className="mt-5 max-w-[40ch] text-lg text-white/80">
          Cette adresse n&apos;existe pas ou a changé. La carte et nos horaires sont toujours là.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/menu">Voir la carte</ButtonLink>
          <ButtonLink href="/" variant="ghost">
            Retour à l&apos;accueil
          </ButtonLink>
        </div>
      </section>
    </main>
  );
}
