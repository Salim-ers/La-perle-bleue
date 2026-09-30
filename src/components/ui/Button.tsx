import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "sand" | "ghost" | "royal" | "outline-dark";

const variants: Record<Variant, string> = {
  sand: "bg-sand text-night hover:bg-sand-2",
  ghost: "border border-white/35 text-white hover:border-white hover:bg-white/5",
  royal: "bg-royal text-white hover:bg-deep",
  "outline-dark": "border border-deep/30 text-deep hover:border-deep hover:bg-deep/5",
};

const base =
  "group inline-flex min-h-12 items-center justify-center gap-2.5 rounded-full px-6 text-[15px] font-semibold whitespace-nowrap transition-[transform,background-color,border-color] duration-300 ease-[var(--ease-soft)] hover:-translate-y-0.5 active:translate-y-0";

interface Props extends Omit<ComponentProps<"a">, "href"> {
  href: string | null;
  variant?: Variant;
  icon?: ReactNode;
  /** Texte affiché quand le lien n'existe pas encore (donnée à compléter). */
  missingLabel?: string;
}

export function ButtonLink({
  href,
  variant = "sand",
  icon,
  children,
  className,
  missingLabel = "à compléter",
  ...rest
}: Props) {
  if (!href) {
    return (
      <span
        aria-disabled="true"
        title="Information à compléter"
        className={cn(
          base,
          "cursor-not-allowed border border-dashed border-current opacity-60 hover:translate-y-0",
          variant === "outline-dark" || variant === "royal" ? "text-deep" : "text-white",
          className,
        )}
      >
        {icon}
        {children}
        <span className="text-xs font-normal opacity-80">({missingLabel})</span>
      </span>
    );
  }
  const external = /^(https?:|tel:|mailto:)/.test(href);
  const cls = cn(base, variants[variant], className);
  if (external) {
    const isWeb = href.startsWith("http");
    return (
      <a
        href={href}
        className={cls}
        {...(isWeb ? { target: "_blank", rel: "noopener noreferrer" } : {})}
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
