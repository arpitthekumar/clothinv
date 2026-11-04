"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

// Configurable flag for background polling (disabled for clean hybrid POS activity model)
const ENABLE_CONTINUOUS_POLLING = false;

let globalIsBusy = false;
let globalOperation: string | undefined = undefined;

export function setGlobalPosBusy(isBusy: boolean, operation?: string) {
  globalIsBusy = isBusy;
  globalOperation = isBusy ? (operation || "POS Sale in Progress") : undefined;
}

export function usePosHeartbeat() {
  const { user } = useAuth();
  const { toast } = useToast();
  const busyRef = useRef(globalIsBusy);
  const operationRef = useRef(globalOperation);
  const isStoppedRef = useRef(false);

  busyRef.current = globalIsBusy;
  operationRef.current = globalOperation;

  const sendStateUpdate = useCallback(async () => {
    if (!user || isStoppedRef.current) return;

    try {
      const res = await fetch("/api/user/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isBusy: busyRef.current,
          currentOperation: operationRef.current,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 401 || res.status === 400) {
          isStoppedRef.current = true;
          if (res.status === 401 && data.revoked) {
            toast({
              title: "Session Disconnected",
              description: "Your session was logged out or revoked from another device.",
              variant: "destructive",
            });
            if (typeof window !== "undefined") {
              window.location.assign("/auth");
            }
          }
        }
      }
    } catch {
      // Ignore network errors
    }
  }, [user, toast]);

  useEffect(() => {
    if (!user) return;
    isStoppedRef.current = false;

    // Optional background polling (disabled by default)
    if (!ENABLE_CONTINUOUS_POLLING) return;

    sendStateUpdate();

    const interval = setInterval(() => {
      if (isStoppedRef.current) {
        clearInterval(interval);
        return;
      }
      sendStateUpdate();
    }, 60000);

    return () => clearInterval(interval);
  }, [user, sendStateUpdate]);

  const setBusyState = useCallback((isBusy: boolean, operation?: string) => {
    setGlobalPosBusy(isBusy, operation);
    if (!isStoppedRef.current) {
      sendStateUpdate();
    }
  }, [sendStateUpdate]);

  return { setPosBusy: setBusyState };
}
