"use client";

import { useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

export function NetworkStatusListener() {
  const { toast } = useToast();
  const wasOffline = useRef<boolean>(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      wasOffline.current = false;
      toast({ title: "Back online", description: "You're connected." });
    };
    const handleOffline = () => {
      wasOffline.current = true;
      toast({ title: "Offline disabled", description: "Internet required to use the app.", variant: "destructive" });
    };
    const handleDataSync = (_e: Event) => {};

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("dataSync", handleDataSync as any);

    // Initial state toast
    if (!navigator.onLine) {
      toast({ title: "Offline disabled", description: "Internet required to use the app.", variant: "destructive" });
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("dataSync", handleDataSync as any);
    };
  }, [toast]);

  return null;
}


