import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "sand" | "ghost" | "royal" | "outline-dark" | "white";
type Size = "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-royal text-white shadow-[0_14px_30px_-14px_rgba(1,64,184,0.85)] hover:bg-deep hover:shadow-[0_18px_34px_-14px_rgba(1,64,184,0.9)]",
  royal: "bg-royal text-white hover:bg-deep",
  sand: "bg-sand text-night hover:bg-sand-2",
  ghost: "border border-white/40 text-white hover:border-white hover:bg-white/8",
  "outline-dark": "border-[1.5px] border-deep/25 text-deep hover:border-deep hover:bg-deep/5",
  white: "bg-white text-night hover:bg-cream",
};

const sizes: Record<Size, string> = {
  md: "min-h-12 px-6 text-[13.5px]",
  lg: "min-h-14 px-8 text-[14.5px]",
};

/** Classes partagées par les liens et les <button> d'action. */
export function buttonClasses({
  variant = "primary",
  size = "md",
  className,
}: { variant?: Variant; size?: Size; className?: string } = {}) {
  return cn(
    "group inline-flex items-center justify-center gap-2.5 rounded-full font-bold tracking-[0.06em] whitespace-nowrap uppercase transition-[transform,background-color,border-color,box-shadow] duration-300 ease-[var(--ease-soft)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
    sizes[size],
    variants[variant],
    className,
  );
}

interface Props extends Omit<ComponentProps<"a">, "href"> {
  /** `null` : donnée non renseignée (téléphone, itinéraire…) -> le bouton n'est pas affiché. */
  href: string | null;
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
}

export function ButtonLink({ href, variant = "primary", size = "md", icon, children, className, ...rest }: Props) {
  if (!href) return null;
  const cls = buttonClasses({ variant, size, className });
  if (/^(https?:|tel:|mailto:)/.test(href)) {
    return (
      <a
        href={href}
        className={cls}
        {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        {...rest}
      >
        {icon}
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls} {...rest}>
      {icon}
      {children}
    </Link>
  );
}
