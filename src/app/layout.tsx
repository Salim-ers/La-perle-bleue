import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileActionBar } from "@/components/layout/MobileActionBar";
import { Providers } from "@/components/layout/Providers";
import { RestaurantJsonLd } from "@/components/layout/JsonLd";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { CartToast } from "@/components/cart/CartToast";
import { ProductConfigurator } from "@/components/order/ProductConfigurator";
import { directionsHref, phoneHref, showReviews } from "@/lib/contact";
import { defaultDescription, defaultTitle, nav, siteUrl } from "@/lib/site";

const display = localFont({
  src: [
    { path: "../fonts/big-shoulders-display-latin-700-normal.woff2", weight: "700" },
    { path: "../fonts/big-shoulders-display-latin-800-normal.woff2", weight: "800" },
    { path: "../fonts/big-shoulders-display-latin-900-normal.woff2", weight: "900" },
  ],
  variable: "--font-bsd",
  display: "swap",
  fallback: ["Arial Narrow", "Impact", "sans-serif"],
});

const sans = localFont({
  src: [
    { path: "../fonts/figtree-latin-400-normal.woff2", weight: "400" },
    { path: "../fonts/figtree-latin-500-normal.woff2", weight: "500" },
    { path: "../fonts/figtree-latin-600-normal.woff2", weight: "600" },
    { path: "../fonts/figtree-latin-700-normal.woff2", weight: "700" },
  ],
  variable: "--font-fig",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: defaultTitle, template: "%s | La Perle Bleue" },
  description: defaultDescription,
  applicationName: "La Perle Bleue",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "La Perle Bleue",
    title: defaultTitle,
    description: defaultDescription,
    url: "/",
  },
  twitter: { card: "summary_large_image", title: defaultTitle, description: defaultDescription },
  formatDetection: { telephone: true },
};

export const viewport: Viewport = {
  themeColor: "#faf7f2",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const navItems = nav
    .filter((n) => !("requiresReviews" in n) || showReviews)
    .map(({ href, label }) => ({ href, label }));
  return (
    <html lang="fr" className={`${display.variable} ${sans.variable}`}>
      <body>
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
      </body>
    </html>
  );
}
