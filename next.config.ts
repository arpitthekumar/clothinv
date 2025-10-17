import type { NextConfig } from "next";
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: true,
};

// Wrap with PWA config
const pwaConfig = withPWA({
  dest: "public",
  register: false,
  skipWaiting: true,
  disable:
    process.env.NODE_ENV === "development" ||
    process.env.NODE_ENV === "production",
})(nextConfig);

export default pwaConfig;
