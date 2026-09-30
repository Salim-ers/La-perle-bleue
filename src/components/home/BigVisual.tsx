"use client";

import Image from "next/image";
import { m, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { images } from "@/data/images";
import { ButtonLink } from "@/components/ui/Button";

export function BigVisual() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-6%", "6%"]);
  const img = images["vitrine-broche"];
  const mobileImg = images["hero-assiettes"];

  return (
    <section
      ref={ref}
      aria-labelledby="genereux-title"
      className="relative flex min-h-[78svh] items-end overflow-hidden bg-night lg:min-h-[88vh]"
    >
      <m.div style={{ y }} className="absolute -inset-y-[8%] inset-x-0">
        {/* Direction artistique : portrait des assiettes sur mobile, vitrine en paysage sur desktop */}
        <Image
          src={mobileImg.src}
          alt={mobileImg.alt}
          fill
          placeholder="blur"
          sizes="100vw"
          className="object-cover md:hidden"
        />
        <Image
          src={img.src}
          alt={img.alt}
          fill
          placeholder="blur"
          sizes="100vw"
          className="hidden object-cover md:block"
        />
      </m.div>
      <div className="absolute inset-0 bg-gradient-to-t from-night via-night/55 to-night/5" />
      <div className="container-x relative pb-16 lg:pb-24">
        <h2 id="genereux-title" className="display text-[clamp(3.4rem,10vw,7.5rem)] text-white">
          Généreux par nature.
        </h2>
        <p className="mt-5 max-w-[40ch] text-lg text-white/80">
          Grandes assiettes, grill et broche : de quoi repartir rassasié.
        </p>
        <ButtonLink href="/menu" variant="sand" className="mt-8">
          Voir le menu
        </ButtonLink>
      </div>
    </section>
  );
}
