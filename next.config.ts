import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // doc-to-md-rag → pdf.js-extract resolves pdf.worker.js relative to node_modules;
  // bundling breaks that path in production (`next start` / Vercel).
  serverExternalPackages: [
    "doc-to-md-rag",
    "pdf.js-extract",
    "mammoth",
    "turndown",
    "turndown-plugin-gfm",
  ],
};

export default nextConfig;
