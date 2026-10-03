import type { Metadata, Viewport } from "next";
import { PwaRegister } from "@/components/admin/PwaRegister";

/** Interface cuisine : application à part (PWA « La Perle Bleue Cuisine »), jamais indexée. */
export const metadata: Metadata = {
  title: { default: "Cuisine", template: "%s | La Perle Bleue Cuisine" },
  applicationName: "La Perle Bleue Cuisine",
  manifest: "/admin/manifest.webmanifest",
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: "Cuisine", statusBarStyle: "black-translucent" },
  icons: { apple: "/admin/icons/icon-192.png" },
};

export const viewport: Viewport = {
  themeColor: "#0b1220",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="on-dark min-h-svh bg-[#0b1220] text-white antialiased">
      {children}
      <PwaRegister />
    </div>
  );
}
