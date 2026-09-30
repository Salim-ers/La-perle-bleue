"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, m } from "framer-motion";
import { MapPin, Menu, Phone, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { OpenStatus } from "@/components/info/OpenStatus";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string };

export function Header({
  nav,
  directionsHref,
  phoneHref,
}: {
  nav: NavItem[];
  directionsHref: string | null;
  phoneHref: string | null;
}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : !href.includes("#") && pathname.startsWith(href);

  const findHref = directionsHref ?? "/contact";
  const findExternal = !!directionsHref;

  return (
    <>
      <a
        href="#contenu"
        className="fixed top-2 left-2 z-[70] -translate-y-24 rounded-full bg-sand px-4 py-2 font-semibold text-night focus:translate-y-0"
      >
        Aller au contenu
      </a>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color,backdrop-filter] duration-500",
          scrolled || open
            ? "border-white/10 bg-night/82 backdrop-blur-md"
            : "border-transparent bg-transparent",
        )}
      >
        <div className="container-x flex h-[var(--header-h)] items-center justify-between gap-6">
          <Link href="/" aria-label="La Perle Bleue, accueil" className="shrink-0">
            <Logo priority className="w-[150px] lg:w-[178px]" />
          </Link>

          <nav aria-label="Navigation principale" className="hidden lg:block">
            <ul className="flex items-center gap-7 text-[15px] font-medium text-white/85">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className={cn(
                      "link-line py-1 transition-colors hover:text-white",
                      isActive(item.href) && "text-white [background-size:100%_1.5px]",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            <a
              href={findHref}
              {...(findExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="hidden min-h-11 items-center gap-2 rounded-full bg-sand px-5 text-[15px] font-semibold text-night transition-[transform,background-color] duration-300 hover:-translate-y-0.5 hover:bg-sand-2 sm:inline-flex"
            >
              <MapPin className="size-4" aria-hidden="true" />
              Nous trouver
            </a>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="menu-mobile"
              aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
              className="grid size-11 place-items-center rounded-full text-white hover:bg-white/10 lg:hidden"
            >
              {open ? <X className="size-6" /> : <Menu className="size-6" />}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <m.div
            id="menu-mobile"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="grain fixed inset-0 z-40 flex flex-col bg-night pt-[var(--header-h)] lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <nav aria-label="Navigation mobile" className="container-x flex-1 overflow-y-auto pt-8">
              <ul className="space-y-1">
                {nav.map((item, i) => (
                  <m.li
                    key={item.href}
                    initial={{ opacity: 0, x: -14 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.04 * i + 0.05, duration: 0.35 }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      aria-current={isActive(item.href) ? "page" : undefined}
                      className={cn(
                        "display block py-2 text-[44px] text-white/90",
                        isActive(item.href) && "text-sand",
                      )}
                    >
                      {item.label}
                    </Link>
                  </m.li>
                ))}
              </ul>
            </nav>
            <div className="container-x space-y-4 border-t border-white/10 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
              <OpenStatus />
              <div className="grid grid-cols-2 gap-3">
                {phoneHref ? (
                  <a href={phoneHref} className="flex min-h-13 items-center justify-center gap-2 rounded-full border border-white/30 font-semibold">
                    <Phone className="size-4" aria-hidden="true" /> Appeler
                  </a>
                ) : (
                  <Link href="/menu" onClick={() => setOpen(false)} className="flex min-h-13 items-center justify-center rounded-full border border-white/30 font-semibold">
                    Voir la carte
                  </Link>
                )}
                <a
                  href={findHref}
                  {...(findExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="flex min-h-13 items-center justify-center gap-2 rounded-full bg-sand font-semibold text-night"
                >
                  <MapPin className="size-4" aria-hidden="true" /> Itinéraire
                </a>
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </>
  );
}
