import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    // Every image is a local asset in /public, so no remote patterns are needed.
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
