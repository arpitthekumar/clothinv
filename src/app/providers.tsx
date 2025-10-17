"use client";

import { ReactNode, useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { Toaster } from "@/components/ui/toaster";
import { NetworkStatusListener } from "@/components/shared/network-status-listener";

export default function Providers({ children }: { children: ReactNode }) {
  // Online-only mode: disable service worker registration and background sync; also unregister any existing SW
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then(regs => {
        regs.forEach(reg => reg.unregister().catch(() => {}));
      }).catch(() => {});
    }
  }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          {/* NetworkStatusListener retained for UI messaging, but app requires online */}
          {children}
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}


