import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/commande", "/api/", "/admin", "/demo", "/suivi"] },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
