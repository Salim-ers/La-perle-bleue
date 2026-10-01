"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, m } from "framer-motion";
import { ArrowRight, MapPin, Menu, Phone, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { OpenStatus } from "@/components/info/OpenStatus";
import { CartButton } from "@/components/cart/CartButton";
import { lockScroll } from "@/lib/scroll-lock";
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
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const unlock = lockScroll();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      unlock();
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : !href.includes("#") && pathname.startsWith(href);

  return (
    <>
      <a
        href="#contenu"
        className="fixed top-2 left-2 z-[70] -translate-y-24 rounded-full bg-royal px-4 py-2 font-semibold text-white focus:translate-y-0"
      >
        Aller au contenu
      </a>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color,box-shadow] duration-300",
          scrolled || open
            ? "border-line/70 bg-cream/90 shadow-[0_12px_32px_-28px_rgba(6,19,46,0.6)] backdrop-blur-md"
            : "border-transparent bg-cream",
        )}
      >
        <div className="container-x flex h-[var(--header-h)] items-center justify-between gap-6">
          <Link href="/" aria-label="La Perle Bleue, accueil" className="shrink-0">
            <Logo variant="dark" priority className="w-[148px] lg:w-[172px]" />
          </Link>

          <nav aria-label="Navigation principale" className="hidden lg:block">
            <ul className="flex items-center gap-7 text-[15px] font-semibold text-night/75">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className={cn(
                      "link-line py-1 transition-colors hover:text-night",
                      isActive(item.href) && "text-royal [background-size:100%_1.5px]",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-3">
            <CartButton />
            <div className="hidden sm:block">
              <ButtonLink href="/menu">Commander</ButtonLink>
            </div>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="menu-mobile"
              aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
              className="grid size-11 place-items-center rounded-full text-night hover:bg-night/6 lg:hidden"
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
            className="grain on-dark fixed inset-0 z-[45] flex flex-col bg-night pt-[var(--header-h)] lg:hidden"
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
                      className={cn("display block py-2 text-[44px] text-white/90", isActive(item.href) && "text-sand")}
                    >
                      {item.label}
                    </Link>
                  </m.li>
                ))}
              </ul>
            </nav>
            <div className="container-x space-y-4 border-t border-white/10 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
              <OpenStatus />
              <Link
                href="/menu"
                onClick={() => setOpen(false)}
                className="flex min-h-14 items-center justify-center gap-2 rounded-full bg-royal text-[15px] font-bold tracking-[0.06em] text-white uppercase"
              >
                Commander <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              {(phoneHref || directionsHref) && (
                <div className="flex gap-3">
                  {phoneHref && (
                    <a
                      href={phoneHref}
                      className="flex min-h-13 flex-1 items-center justify-center gap-2 rounded-full border border-white/30 font-semibold"
                    >
                      <Phone className="size-4" aria-hidden="true" /> Appeler
                    </a>
                  )}
                  {directionsHref && (
                    <a
                      href={directionsHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex min-h-13 flex-1 items-center justify-center gap-2 rounded-full border border-white/30 font-semibold"
                    >
                      <MapPin className="size-4" aria-hidden="true" /> Itinéraire
                    </a>
                  )}
                </div>
              )}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </>
  );
}
