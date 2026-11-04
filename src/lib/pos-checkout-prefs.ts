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

export type PresetMode = "custom" | "fast" | "safe" | "balanced";

export type AllowedDiscountModes =
  | "all"
  | "coupon_only"
  | "percentage_only"
  | "fixed_only"
  | "percentage_and_coupon";

export type DefaultDiscountType = "percentage" | "fixed" | "coupon";

export type PosCheckoutPrefs = {
  version: 1;
  preset: PresetMode;
  paymentConfirmMode: PaymentConfirmMode;
  /** Seconds before auto-action; 0 = fire immediately when the dialog opens. */
  paymentConfirmAutoSeconds: number;
  paymentConfirmAutoButton: PaymentConfirmButtonId;
  thankYouMode: ThankYouMode;
  thankYouAutoSeconds: number;
  thankYouAutoButton: ThankYouButtonId;
  /** Whether to play sound before automation runs */
  soundEnabled: boolean;

  /** Allowed Cart Discount Modes */
  allowedDiscountModes: AllowedDiscountModes;
  /** Whether automatic default discount for new cart is enabled */
  defaultDiscountEnabled: boolean;
  /** Default discount type: percentage | fixed | coupon */
  defaultDiscountType: DefaultDiscountType;
  /** Default discount value (e.g. 10 for 10% or ₹10, or coupon code) */
  defaultDiscountValue: string;
};

export const DEFAULT_POS_CHECKOUT_PREFS: PosCheckoutPrefs = {
  version: 1,
  preset: "safe",
  paymentConfirmMode: "manual",
  paymentConfirmAutoSeconds: 3,
  paymentConfirmAutoButton: "payment_done",
  thankYouMode: "manual",
  thankYouAutoSeconds: 0,
  thankYouAutoButton: "close",
  soundEnabled: true,
  allowedDiscountModes: "all",
  defaultDiscountEnabled: false,
  defaultDiscountType: "percentage",
  defaultDiscountValue: "0",
};

export const PRESET_CONFIGS: Record<PresetMode, Omit<PosCheckoutPrefs, 'version' | 'preset'>> = {
  custom: {
    paymentConfirmMode: "manual",
    paymentConfirmAutoSeconds: 3,
    paymentConfirmAutoButton: "payment_done",
    thankYouMode: "manual",
    thankYouAutoSeconds: 0,
    thankYouAutoButton: "close",
    soundEnabled: true,
    allowedDiscountModes: "all",
    defaultDiscountEnabled: false,
    defaultDiscountType: "percentage",
    defaultDiscountValue: "0",
  },
  fast: {
    paymentConfirmMode: "none",
    paymentConfirmAutoSeconds: 0,
    paymentConfirmAutoButton: "payment_done",
    thankYouMode: "automated",
    thankYouAutoSeconds: 1,
    thankYouAutoButton: "close",
    soundEnabled: true,
    allowedDiscountModes: "all",
    defaultDiscountEnabled: false,
    defaultDiscountType: "percentage",
    defaultDiscountValue: "0",
  },
  safe: {
    paymentConfirmMode: "manual",
    paymentConfirmAutoSeconds: 0,
    paymentConfirmAutoButton: "payment_done",
    thankYouMode: "manual",
    thankYouAutoSeconds: 0,
    thankYouAutoButton: "close",
    soundEnabled: true,
    allowedDiscountModes: "all",
    defaultDiscountEnabled: false,
    defaultDiscountType: "percentage",
    defaultDiscountValue: "0",
  },
  balanced: {
    paymentConfirmMode: "automated",
    paymentConfirmAutoSeconds: 3,
    paymentConfirmAutoButton: "payment_done",
    thankYouMode: "automated",
    thankYouAutoSeconds: 2,
    thankYouAutoButton: "fast_print",
    soundEnabled: true,
    allowedDiscountModes: "all",
    defaultDiscountEnabled: false,
    defaultDiscountType: "percentage",
    defaultDiscountValue: "0",
  },
};

export function applyPreset(preset: PresetMode): PosCheckoutPrefs {
  const config = PRESET_CONFIGS[preset];
  return {
    version: 1,
    preset,
    ...config,
  };
}

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
