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
  disable: true,
  dest: "public",
  register: false,
  skipWaiting: false,
})(nextConfig);

export default pwaConfig;
