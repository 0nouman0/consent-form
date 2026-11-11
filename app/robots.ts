import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://consentgen.in";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login", "/regulations", "/terms", "/privacy"],
        disallow: [
          "/dashboard",
          "/generate",
          "/history",
          "/templates",
          "/profile",
          "/credits",
          "/chat",
          "/onboarding",
          "/api/",
          "/auth/",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
