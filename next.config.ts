import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Puppeteer & dependensinya menggunakan require() dinamis (CommonJS)
  // yang tidak bisa dianalisis oleh Webpack Next.js 15.
  // Beri tahu Next.js untuk tidak mem-bundle package ini —
  // biarkan Node.js runtime yang mengimpornya langsung.
  serverExternalPackages: [
    "puppeteer",
    "puppeteer-core",
    "puppeteer-extra",
    "puppeteer-extra-plugin-stealth",
    "puppeteer-extra-plugin",
    "clone-deep",
    "merge-deep",
    "pdf-parse",
  ],
};

export default nextConfig;
