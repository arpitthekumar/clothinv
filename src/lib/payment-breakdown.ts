export type PaymentMethodKey = "cash" | "upi" | "card" | "other";

/** Visual key for colours — matches SalesCard `getPaymentColor` (incl. credit, bank). */
export type PaymentVisualKey =
  | "cash"
  | "upi"
  | "card"
  | "credit"
  | "bank"
  | "other";

const KNOWN: PaymentMethodKey[] = ["cash", "upi", "card", "other"];

export function normalizePaymentMethod(
  raw: string | null | undefined
): PaymentMethodKey {
  const s = (raw ?? "cash").toString().toLowerCase().trim();
  return KNOWN.includes(s as PaymentMethodKey)
    ? (s as PaymentMethodKey)
    : "other";
}

/** Same hue mapping as SalesCard payment line (text-*-600). */
export function getPaymentMethodTextClass(method: string = ""): string {
  switch (method.toLowerCase()) {
    case "upi":
      return "text-green-600";
    case "cash":
      return "text-yellow-600";
    case "card":
      return "text-blue-600";
    case "credit":
      return "text-purple-600";
    case "bank":
      return "text-orange-600";
    default:
      return "text-gray-600";
  }
}

export function resolvePaymentVisualKey(
  raw: string | null | undefined
): PaymentVisualKey {
  const s = (raw ?? "").toString().toLowerCase().trim();
  switch (s) {
    case "cash":
      return "cash";
    case "upi":
      return "upi";
    case "card":
      return "card";
    case "credit":
      return "credit";
    case "bank":
      return "bank";
    default:
      return "other";
  }
}

function capitalizePaymentLabel(raw: string): string {
  if (!raw.trim()) return "Other";
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}

const PAYMENT_DISPLAY_LABELS: Record<Exclude<PaymentVisualKey, "other">, string> =
  {
    cash: "Cash",
    upi: "UPI",
    card: "Card",
    credit: "Credit",
    bank: "Bank",
  };

/** Outline badges: same colours as SalesCard + subtle bg/border for tables. */
const PAYMENT_BADGE_CLASS: Record<PaymentVisualKey, string> = {
  upi: "border-green-200 bg-green-50 text-green-600 dark:border-green-800 dark:bg-green-950/40 dark:text-green-400",
  cash: "border-yellow-200 bg-yellow-50 text-yellow-600 dark:border-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-400",
  card: "border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-400",
  credit:
    "border-purple-200 bg-purple-50 text-purple-600 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-400",
  bank: "border-orange-200 bg-orange-50 text-orange-600 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-400",
  other:
    "border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-gray-950/40 dark:text-gray-400",
};

export function getPaymentMethodBadgeProps(
  raw: string | null | undefined
): { label: string; className: string } {
  const key = resolvePaymentVisualKey(raw);
  const label =
    key === "other"
      ? capitalizePaymentLabel((raw ?? "").toString())
      : PAYMENT_DISPLAY_LABELS[key];
  return {
    label,
    className: PAYMENT_BADGE_CLASS[key],
  };
}

export function aggregateSalesByPaymentMethod(
  sales: { total_amount?: string | number | null; payment_method?: string | null }[]
): Record<PaymentMethodKey, number> {
  const totals: Record<PaymentMethodKey, number> = {
    cash: 0,
    upi: 0,
    card: 0,
    other: 0,
  };
  for (const sale of sales) {
    const amt = parseFloat(String(sale.total_amount ?? "0")) || 0;
    const key = normalizePaymentMethod(sale.payment_method);
    totals[key] += amt;
  }
  return totals;
}
