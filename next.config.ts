import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [390, 640, 828, 1080, 1280, 1600, 1920],
  },
  poweredByHeader: false,
  // Ancienne page Galerie retirée : les liens déjà partagés renvoient à l'accueil.
  async redirects() {
    return [{ source: "/galerie", destination: "/", permanent: true }];
  },
};

export default nextConfig;
