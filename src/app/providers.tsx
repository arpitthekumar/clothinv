"use client";

import { ReactNode, useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { Toaster } from "@/components/ui/toaster";
import { NetworkStatusListener } from "@/components/shared/network-status-listener";

export default function Providers({ children }: { children: ReactNode }) {
  // Register service worker and wire bg-sync to app sync
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
      navigator.serviceWorker.addEventListener("message", (event: MessageEvent) => {
        if (event.data?.type === "bg-sync") {
          // Lazy import to avoid bundle impact
          import("@/lib/supabase-sync").then(m => m.supabaseSync.syncData()).catch(() => {});
        }
      });

      // Minimal push subscription (only if already granted)
      if (Notification && Notification.permission === "granted") {
        navigator.serviceWorker.ready.then(async (reg) => {
          try {
            const sub = await reg.pushManager.getSubscription();
            if (!sub) {
              // Note: For real push, provide applicationServerKey (VAPID public key)
              // Here we only proceed if a browser default is available or skip silently
              // to avoid breaking existing flows.
              await reg.pushManager.subscribe({ userVisibleOnly: true });
            }
            const finalSub = await reg.pushManager.getSubscription();
            if (finalSub) {
              await fetch("/api/notifications/subscribe", { method: "POST", body: JSON.stringify(finalSub), headers: { "Content-Type": "application/json" } });
            }
          } catch {}
        });
      }
    }
  }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <NetworkStatusListener />
          {children}
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}


