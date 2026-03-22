export const POS_CHECKOUT_STORAGE_KEY = "clothinv.pos.checkout.v1";

export type PaymentConfirmMode = "manual" | "automated" | "none";

/** Which dialog action runs when the automation timer completes. */
export type PaymentConfirmButtonId = "payment_done" | "cancel";

export type ThankYouMode = "manual" | "automated";

export type ThankYouButtonId =
  | "whatsapp"
  | "fast_print"
  | "image"
  | "pdf"
  | "close";

export type PosCheckoutPrefs = {
  version: 1;
  paymentConfirmMode: PaymentConfirmMode;
  /** Seconds before auto-action; 0 = fire immediately when the dialog opens. */
  paymentConfirmAutoSeconds: number;
  paymentConfirmAutoButton: PaymentConfirmButtonId;
  thankYouMode: ThankYouMode;
  thankYouAutoSeconds: number;
  thankYouAutoButton: ThankYouButtonId;
};

export const DEFAULT_POS_CHECKOUT_PREFS: PosCheckoutPrefs = {
  version: 1,
  paymentConfirmMode: "manual",
  paymentConfirmAutoSeconds: 3,
  paymentConfirmAutoButton: "payment_done",
  thankYouMode: "manual",
  thankYouAutoSeconds: 0,
  thankYouAutoButton: "close",
};

export function getPosCheckoutPrefs(): PosCheckoutPrefs {
  if (typeof window === "undefined") return DEFAULT_POS_CHECKOUT_PREFS;
  try {
    const raw = localStorage.getItem(POS_CHECKOUT_STORAGE_KEY);
    if (!raw) return DEFAULT_POS_CHECKOUT_PREFS;
    const parsed = JSON.parse(raw) as Partial<PosCheckoutPrefs>;
    return { ...DEFAULT_POS_CHECKOUT_PREFS, ...parsed, version: 1 };
  } catch {
    return DEFAULT_POS_CHECKOUT_PREFS;
  }
}

export function setPosCheckoutPrefs(next: PosCheckoutPrefs): void {
  localStorage.setItem(POS_CHECKOUT_STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("pos-checkout-prefs-changed"));
}
