declare module "next-pwa" {
    import { NextConfig } from "next";
  
    type PWAConfig = {
      dest?: string;
      register?: boolean;
      skipWaiting?: boolean;
      disable?: boolean;
      buildExcludes?: string[];
      runtimeCaching?: any[];
    };
  
    export default function withPWA(pwaConfig?: PWAConfig): (nextConfig: NextConfig) => NextConfig;
  }
  