"use client";

import { useEffect, useState } from "react";
import {
  getProductDefaultPrefs,
  setProductDefaultPrefs,
  type ProductDefaultPrefs,
} from "@/lib/product-default-prefs";

export function useProductDefaultPrefs() {
  const [prefs, setPrefs] = useState<ProductDefaultPrefs>(getProductDefaultPrefs);

  useEffect(() => {
    const handleUpdate = () => {
      setPrefs(getProductDefaultPrefs());
    };
    window.addEventListener("product-default-prefs-changed", handleUpdate);
    return () => {
      window.removeEventListener("product-default-prefs-changed", handleUpdate);
    };
  }, []);

  const updatePrefs = (next: Partial<ProductDefaultPrefs>) => {
    const newPrefs: ProductDefaultPrefs = {
      ...prefs,
      ...next,
      version: 1,
    };
    setPrefs(newPrefs);
    setProductDefaultPrefs(newPrefs);
  };

  return { prefs, updatePrefs };
}
