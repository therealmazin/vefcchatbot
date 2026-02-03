import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Server external packages that shouldn't be bundled
  serverExternalPackages: [
    "@xenova/transformers",
    "pdf-parse",
    "mammoth",
  ],

  // Empty turbopack config to use Turbopack (Next.js 16 default)
  turbopack: {},
};

export default nextConfig;
