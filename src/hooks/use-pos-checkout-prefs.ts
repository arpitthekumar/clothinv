"use client";

import { useEffect, useState } from "react";
import {
  getPosCheckoutPrefs,
  type PosCheckoutPrefs,
} from "@/lib/pos-checkout-prefs";

export function usePosCheckoutPrefs(): PosCheckoutPrefs {
  const [prefs, setPrefs] = useState<PosCheckoutPrefs>(getPosCheckoutPrefs);

  useEffect(() => {
    const sync = () => setPrefs(getPosCheckoutPrefs());
    window.addEventListener("pos-checkout-prefs-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("pos-checkout-prefs-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return prefs;
}
