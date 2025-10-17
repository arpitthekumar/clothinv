"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  // iOS Safari
  // @ts-ignore
  if (window.navigator.standalone) return true;
  // Other browsers
  return window.matchMedia && window.matchMedia("(display-mode: standalone)").matches;
}

export function InstallPwaButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(!isStandaloneDisplay());
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);

    // Hide button if already installed
    setVisible(!isStandaloneDisplay());

    const mq = window.matchMedia ? window.matchMedia("(display-mode: standalone)") : null;
    const onChange = () => setVisible(!isStandaloneDisplay());
    mq?.addEventListener?.("change", onChange);

    window.addEventListener("appinstalled", onChange);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      mq?.removeEventListener?.("change", onChange);
      window.removeEventListener("appinstalled", onChange);
    };
  }, []);

  if (!visible) return null;

  const handleClick = async () => {
    try {
      if (deferredPrompt) {
        await deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        setDeferredPrompt(null);
        setVisible(false);
      } else {
        // Some browsers show an automatic prompt if criteria met; fall back no-op
      }
    } catch {}
  };

  return (
    <Button size="sm" variant="outline" onClick={handleClick}>
      Install App
    </Button>
  );
}


