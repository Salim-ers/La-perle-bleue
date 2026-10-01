"use client";

import { m, type Variants } from "framer-motion";
import type { ReactNode } from "react";

const list: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

/** Liste dont les éléments apparaissent en cascade à l'entrée dans l'écran. */
export function StaggerList({
  children,
  className,
  label,
}: {
  children: ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <m.ul
      aria-label={label}
      className={className}
      variants={list}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-10% 0px" }}
    >
      {children}
    </m.ul>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <m.li variants={item} className={className}>
      {children}
    </m.li>
  );
}
