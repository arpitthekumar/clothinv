export type PaymentMethodKey = "cash" | "upi" | "card" | "other";

const KNOWN: PaymentMethodKey[] = ["cash", "upi", "card", "other"];

export function normalizePaymentMethod(
  raw: string | null | undefined
): PaymentMethodKey {
  const s = (raw ?? "cash").toString().toLowerCase().trim();
  return KNOWN.includes(s as PaymentMethodKey)
    ? (s as PaymentMethodKey)
    : "other";
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
