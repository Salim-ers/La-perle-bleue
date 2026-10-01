"use client";

import Image from "next/image";
import { m, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useRef } from "react";
import { images } from "@/data/images";
import { ButtonLink } from "@/components/ui/Button";

export function BigVisual() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  // Parallaxe légère + très léger zoom arrière pendant le défilement.
  const y = useTransform(scrollYProgress, [0, 1], ["-7%", "7%"]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1.12, 1.02]);
  const img = images["vitrine-broche"];
  const mobileImg = images["hero-assiettes"];

  return (
    <section
      ref={ref}
      aria-labelledby="genereux-title"
      className="on-dark relative flex min-h-[86svh] items-end overflow-hidden bg-night lg:min-h-[100svh]"
    >
      <m.div style={{ y, scale }} className="absolute -inset-y-[9%] inset-x-0">
        {/* Portrait des assiettes sur mobile, vitrine et broche en paysage sur desktop */}
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
          className="hidden object-cover object-[50%_78%] md:block"
        />
      </m.div>
      <div className="absolute inset-0 bg-gradient-to-t from-night via-night/45 to-night/0" />
      <div className="absolute inset-y-0 left-0 hidden w-2/3 bg-gradient-to-r from-night/60 to-transparent lg:block" />

      <m.div
        className="container-x relative pb-16 lg:pb-28"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-15% 0px" }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      >
        <h2 id="genereux-title" className="display text-[clamp(3.6rem,11vw,9rem)] text-white">
          Généreux par nature.
        </h2>
        <p className="mt-5 max-w-[38ch] text-lg text-white/85 lg:text-xl">
          Du grill, des portions généreuses et des recettes qui calent vraiment.
        </p>
        <ButtonLink href="/menu" size="lg" className="mt-8">
          Commander maintenant
          <ArrowRight className="size-[18px] transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </ButtonLink>
      </m.div>
    </section>
  );
}
