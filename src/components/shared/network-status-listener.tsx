"use client";

import { useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

export function NetworkStatusListener() {
  const { toast } = useToast();
  const wasOffline = useRef<boolean>(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      wasOffline.current = false;
      toast({ title: "Back online", description: "Syncing data..." });
    };
    const handleOffline = () => {
      wasOffline.current = true;
      toast({ title: "Offline mode", description: "Changes will be saved and synced later." });
    };
    const handleDataSync = (e: Event) => {
      const detail = (e as CustomEvent).detail as any;
      if (detail?.success) {
        toast({ title: "Sync complete", description: "Your data is up to date." });
      } else {
        toast({ title: "Sync failed", description: "Will retry automatically.", variant: "destructive" });
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("dataSync", handleDataSync as any);

    // Initial state toast
    if (!navigator.onLine) {
      toast({ title: "Offline mode", description: "Changes will be saved and synced later." });
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("dataSync", handleDataSync as any);
    };
  }, [toast]);

  return null;
}


