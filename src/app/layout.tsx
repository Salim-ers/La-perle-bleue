import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { defaultDescription, defaultTitle, siteUrl } from "@/lib/site";

/**
 * Layout racine : polices et métadonnées communes.
 * Le site client est dans app/(site) (header, panier…), l'interface cuisine dans app/admin.
 */
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
  return (
    <html lang="fr" className={`${display.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
