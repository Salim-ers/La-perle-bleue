import { ButtonLink } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <section className="grain flex min-h-[80svh] items-center bg-night pt-[var(--header-h)]">
      <div className="container-x">
        <h1 className="display text-[clamp(3.4rem,10vw,7rem)] text-white">Page introuvable.</h1>
        <p className="mt-5 max-w-[40ch] text-lg text-white/80">
          Cette adresse n&apos;existe pas ou a changé. La carte et nos horaires sont toujours là.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/menu">Voir la carte</ButtonLink>
          <ButtonLink href="/" variant="ghost">Retour à l&apos;accueil</ButtonLink>
        </div>
      </div>
    </section>
  );
}
