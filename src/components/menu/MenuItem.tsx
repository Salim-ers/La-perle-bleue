import Image from "next/image";
import { images } from "@/data/images";
import { formatPrice, spokenPrice, type MenuProduct } from "@/data/menu";
import { PriceBadge } from "@/components/ui/PriceBadge";
import { AddToCartButton } from "@/components/order/AddToCartButton";
import { cn } from "@/lib/utils";

/** Prix en une ligne (mobile) : « 7€00 · Avec frites 7€50 » ou « Petite 2€00 · Grande 3€00 ». */
function priceLine(p: MenuProduct) {
  const options = (p.priceOptions ?? []).map((o) => ({ label: o.label, price: o.price }));
  return p.price !== null ? [{ label: "", price: p.price }, ...options] : options;
}

export function MenuItem({
  product,
  tone = "light",
  onOpen,
  orderable = false,
}: {
  product: MenuProduct;
  tone?: "light" | "dark";
  onOpen?: (p: MenuProduct) => void;
  /** Affiche le bouton « + » (ajout au panier / configurateur). */
  orderable?: boolean;
}) {
  const img = product.imageKey ? images[product.imageKey] : null;
  const light = tone === "light";
  return (
    <li className={cn("flex items-center gap-4 border-b py-5", light ? "border-line" : "border-white/10")}>
      {img && onOpen && (
        <button
          type="button"
          onClick={() => onOpen(product)}
          aria-label={`Voir la photo : ${product.name}`}
          className="group relative size-[68px] shrink-0 overflow-hidden rounded-full ring-2 ring-nazar ring-offset-2 ring-offset-white"
        >
          <Image
            src={img.src}
            alt=""
            fill
            sizes="68px"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.08]"
          />
        </button>
      )}
      <div className="min-w-0 flex-1">
        <h3 className={cn("flex flex-wrap items-center gap-2 text-lg font-semibold", light ? "text-night" : "text-white")}>
          {product.name}
          {product.badge && (
            <span className="rounded-full bg-sand px-2.5 py-0.5 text-xs font-semibold text-night">{product.badge}</span>
          )}
        </h3>
        {product.description && (
          <p className={cn("mt-1 text-[15px] leading-snug", light ? "text-slate" : "text-fog")}>{product.description}</p>
        )}
        {/* Mobile : prix en texte, la place manque pour les pastilles. */}
        <p className={cn("mt-1.5 text-[15px] font-bold sm:hidden", light ? "text-deep" : "text-sand")}>
          {priceLine(product).map((o, i) => (
            <span key={o.label || "base"}>
              {i > 0 && <span aria-hidden="true"> · </span>}
              {o.label && `${o.label} `}
              <span aria-hidden="true">{formatPrice(o.price)}</span>
              <span className="sr-only">{spokenPrice(o.price)}</span>
            </span>
          ))}
        </p>
        {product.price !== null && product.priceOptions?.length ? (
          <p className={cn("mt-1.5 hidden text-sm sm:block", light ? "text-royal" : "text-nazar")}>
            {product.priceOptions.map((o) => (
              <span key={o.label}>
                {o.label} : <span aria-hidden="true">{formatPrice(o.price)}</span>
                <span className="sr-only">{spokenPrice(o.price)}</span>
              </span>
            ))}
          </p>
        ) : null}
      </div>
      {product.price !== null ? (
        <div className="hidden shrink-0 sm:block">
          <PriceBadge cents={product.price} size="sm" />
        </div>
      ) : product.priceOptions ? (
        <div className="hidden shrink-0 gap-2 sm:flex">
          {product.priceOptions.map((o) => (
            <div key={o.label} className="flex flex-col items-center gap-1">
              <PriceBadge cents={o.price} size="sm" />
              <span className={cn("text-xs", light ? "text-slate" : "text-fog")}>{o.label}</span>
            </div>
          ))}
        </div>
      ) : null}
      {orderable && <AddToCartButton productId={product.id} name={product.name} />}
    </li>
  );
}
