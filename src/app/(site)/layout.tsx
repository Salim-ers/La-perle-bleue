import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileActionBar } from "@/components/layout/MobileActionBar";
import { Providers } from "@/components/layout/Providers";
import { RestaurantJsonLd } from "@/components/layout/JsonLd";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { CartToast } from "@/components/cart/CartToast";
import { ProductConfigurator } from "@/components/order/ProductConfigurator";
import { directionsHref, phoneHref, showReviews } from "@/lib/contact";
import { nav } from "@/lib/site";

/** Site client : header, panier, configurateur, barre mobile, pied de page. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const navItems = nav.filter((n) => !("requiresReviews" in n) || showReviews).map(({ href, label }) => ({ href, label }));
  return (
    <>
      <Providers>
        <Header nav={navItems} directionsHref={directionsHref} phoneHref={phoneHref} />
        <main id="contenu">{children}</main>
        <Footer nav={navItems} />
        <MobileActionBar phoneHref={phoneHref} directionsHref={directionsHref} />
        <CartToast />
        <CartDrawer />
        <ProductConfigurator />
      </Providers>
      <RestaurantJsonLd />
    </>
  );
}
