export const PRODUCT_DEFAULT_PREFS_KEY = "clothinv.product.defaults.v1";

export type ProductDefaultPrefs = {
  version: 1;
  defaultIsBargainable: boolean;
};

export const DEFAULT_PRODUCT_PREFS: ProductDefaultPrefs = {
  version: 1,
  defaultIsBargainable: false,
};

export function getProductDefaultPrefs(): ProductDefaultPrefs {
  if (typeof window === "undefined") return DEFAULT_PRODUCT_PREFS;
  try {
    const raw = localStorage.getItem(PRODUCT_DEFAULT_PREFS_KEY);
    if (!raw) return DEFAULT_PRODUCT_PREFS;
    const parsed = JSON.parse(raw) as Partial<ProductDefaultPrefs>;
    return {
      version: 1,
      defaultIsBargainable: typeof parsed.defaultIsBargainable === "boolean" ? parsed.defaultIsBargainable : false,
    };
  } catch {
    return DEFAULT_PRODUCT_PREFS;
  }
}

export function setProductDefaultPrefs(next: ProductDefaultPrefs): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PRODUCT_DEFAULT_PREFS_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("product-default-prefs-changed"));
}
