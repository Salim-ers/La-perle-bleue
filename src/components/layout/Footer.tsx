import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { restaurant } from "@/data/restaurant";
import { fullAddress, phoneHref, socials } from "@/lib/contact";
import { WEEK, formatRanges } from "@/lib/hours";

type NavItem = { href: string; label: string };

/** Regroupe les jours consécutifs ayant les mêmes horaires. */
function groupedHours() {
  const groups: { from: string; to: string; value: string }[] = [];
  for (const d of WEEK) {
    const value = formatRanges(restaurant.openingHours[d.id]);
    const last = groups.at(-1);
    if (last && last.value === value) last.to = d.label;
    else groups.push({ from: d.label, to: d.label, value });
  }
  return groups.map((g) => ({
    days: g.from === g.to ? g.from : `Du ${g.from.toLowerCase()} au ${g.to.toLowerCase()}`,
    value: g.value,
  }));
}

export function Footer({ nav }: { nav: NavItem[] }) {
  const year = new Date().getFullYear();
  return (
    <footer className="grain border-t border-white/10 bg-night pb-28 lg:pb-0">
      <div className="container-x grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1.2fr_0.8fr] lg:py-20">
        <div className="max-w-xs">
          <Logo className="w-[190px]" />
          <p className="mt-5 text-fog">
            Restaurant grillade. Kebabs, tacos, burgers et assiettes, sur place ou à emporter.
          </p>
        </div>

        <nav aria-label="Navigation du pied de page">
          <h2 className="display text-2xl text-white">Navigation</h2>
          <ul className="mt-4 space-y-2.5 text-fog">
            {nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="link-line hover:text-white">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="display text-2xl text-white">Restaurant</h2>
          <address className="mt-4 space-y-2.5 text-fog not-italic">
            <p>{fullAddress ?? "Adresse à compléter"}</p>
            <p>
              {phoneHref ? (
                <a href={phoneHref} className="link-line hover:text-white">
                  {restaurant.phone}
                </a>
              ) : (
                "Téléphone à compléter"
              )}
            </p>
          </address>
          <ul className="mt-4 space-y-1 text-sm text-fog">
            {groupedHours().map((g) => (
              <li key={g.days}>
                <span className="text-white/90">{g.days}</span> : {g.value}
              </li>
            ))}
          </ul>
        </div>

        {socials.length > 0 && (
          <div>
            <h2 className="display text-2xl text-white">Réseaux</h2>
            <ul className="mt-4 space-y-2.5 text-fog">
              {socials.map((s) => (
                <li key={s.label}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="link-line hover:text-white">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="border-t border-white/10">
        <div className="container-x flex flex-col gap-3 py-6 text-sm text-fog sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} La Perle Bleue</p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            <li><Link href="/mentions-legales" className="link-line hover:text-white">Mentions légales</Link></li>
            <li><Link href="/politique-confidentialite" className="link-line hover:text-white">Confidentialité</Link></li>
            <li><Link href="/politique-confidentialite#cookies" className="link-line hover:text-white">Cookies</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
