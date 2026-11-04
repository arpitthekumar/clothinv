import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  register: false,
  workboxOptions: {
    skipWaiting: true,
  },
  disable:
    process.env.NODE_ENV === "development" ||
    process.env.NODE_ENV === "production",
});

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: true,
};

export default withPWA(nextConfig);
