import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent Next.js from bundling the Prisma runtime — it uses import.meta.url
  // to locate the native query-engine binary, which breaks when inlined.
  serverExternalPackages: ["@prisma/client"],

  // Ensure the generated Prisma client files (including the native .node binary)
  // are included in Vercel serverless function bundles via output-file tracing.
  outputFileTracingIncludes: {
    "/**": ["./app/generated/prisma/**"],
  },

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "books.google.com" },
      { protocol: "http", hostname: "books.google.com" },
    ],
  },
};

export default nextConfig;
