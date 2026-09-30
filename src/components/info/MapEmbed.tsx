"use client";

import Image from "next/image";
import { MapPin } from "lucide-react";
import { useState } from "react";
import { images } from "@/data/images";

/**
 * Carte Google chargée uniquement au clic : aucun script ni cookie tiers
 * tant que le visiteur ne l'a pas demandé (performances + RGPD).
 */
export function MapEmbed({ src, directionsHref }: { src: string | null; directionsHref: string | null }) {
  const [loaded, setLoaded] = useState(false);
  const bg = images["facade-4x5"];

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[4px] bg-night-2 sm:aspect-[16/7]">
      {loaded && src ? (
        <iframe
          src={src}
          title="Plan d'accès à La Perle Bleue"
          className="absolute inset-0 size-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      ) : (
        <>
          <Image src={bg.src} alt="" fill sizes="100vw" className="object-cover opacity-30 blur-[2px]" />
          <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent_0_47px,rgba(140,200,242,0.09)_47px_48px),repeating-linear-gradient(90deg,transparent_0_47px,rgba(140,200,242,0.09)_47px_48px)]" />
          <div className="absolute inset-0 grid place-items-center p-6 text-center">
            <div>
              <span className="mx-auto grid size-16 place-items-center rounded-full bg-sand text-night ring-8 ring-sand/20">
                <MapPin className="size-7" aria-hidden="true" />
              </span>
              {src ? (
                <>
                  <button
                    type="button"
                    onClick={() => setLoaded(true)}
                    className="mt-6 inline-flex min-h-12 items-center rounded-full bg-white px-6 font-semibold text-night transition-transform hover:-translate-y-0.5"
                  >
                    Afficher la carte
                  </button>
                  <p className="mt-3 text-sm text-fog">La carte est fournie par Google Maps.</p>
                </>
              ) : (
                <p className="mt-6 font-semibold text-white">Adresse à compléter</p>
              )}
              {directionsHref && (
                <a
                  href={directionsHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-line mt-3 inline-block text-sm text-sand"
                >
                  Ouvrir l&apos;itinéraire
                </a>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
