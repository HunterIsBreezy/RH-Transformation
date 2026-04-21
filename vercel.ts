import type { VercelConfig } from "@vercel/config/v1";

export const config: VercelConfig = {
  framework: "nextjs",
  buildCommand: "pnpm build",
  redirects: [
    { source: "/index.html", destination: "/", permanent: true },
    { source: "/fitness.html", destination: "/fitness", permanent: true },
    { source: "/mindset.html", destination: "/mindset", permanent: true },
    { source: "/testimonials.html", destination: "/testimonials", permanent: true },
    { source: "/privacy.html", destination: "/privacy", permanent: true },
    { source: "/terms.html", destination: "/terms", permanent: true },
    { source: "/disclaimer.html", destination: "/disclaimer", permanent: true },
  ],
};

export default config;
