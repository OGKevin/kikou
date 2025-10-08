import type { NextConfig } from "next";

const nextconfig: NextConfig = {
  // ensure next.js uses ssg instead of ssr
  // https://nextjs.org/docs/pages/building-your-application/deploying/static-exports
  output: "export",
  // note: this feature is required to use the next.js image component in ssg mode.
  // see https://nextjs.org/docs/messages/export-image-api for different workarounds.
  images: {
    unoptimized: true,
  },
  // configure assetprefix or else the server won't properly resolve your assets.
  // assetprefix: isprod ? undefined : `http://${internalhost}:3000`,
  eslint: {
    // Disable ESLint during builds since we have our own config
    ignoreDuringBuilds: true,
  },
};

export default nextconfig;
