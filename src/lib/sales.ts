import { SaleItem } from "@shared/schema";

interface SaleCalculation {
  subtotal: number;
  taxPercent: number;
  taxAmount: number;
  discountType?: 'percentage' | 'fixed' | null;
  discountValue: number;
  discountAmount: number;
  total: number;
  taxInclusive?: boolean;
}

export function calculateSaleTotals(
  items: Array<{ quantity: number; price: string | number }>,
  discountType?: string | null,
  discountValue: number = 0,
  taxPercentParam: number = 0,
  taxInclusive: boolean = false
): SaleCalculation {
  // Calculate subtotal (rounded to whole integer)
  const subtotal = Math.round(items.reduce((sum, item) => {
    const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
    return sum + (Math.round(price) * item.quantity);
  }, 0));

  // Calculate discount (rounded to whole integer & clamped to subtotal)
  const rawDiscount = discountType === 'percentage'
    ? Math.round(subtotal * (Math.min(100, Math.max(0, discountValue)) / 100))
    : discountType === 'fixed'
    ? Math.max(0, Math.round(discountValue))
    : 0;

  const discountAmount = Math.min(subtotal, rawDiscount);
  const taxPercent = Math.max(0, taxPercentParam);

  if (taxInclusive && taxPercent > 0) {
    // 🏷️ INCLUSIVE TAX (MRP Includes GST)
    // Total is Subtotal - Discount (no tax added on top)
    const total = Math.max(0, subtotal - discountAmount);
    // Extract GST amount from total: Tax = Total - (Total / (1 + Tax%/100))
    const netBeforeTax = total / (1 + taxPercent / 100);
    const taxAmount = Math.round(total - netBeforeTax);

    return {
      subtotal,
      taxPercent,
      taxAmount,
      discountType: (discountType as 'percentage' | 'fixed' | null) || null,
      discountValue: Math.round(discountValue),
      discountAmount,
      total,
      taxInclusive: true,
    };
  }

  // 🏷️ EXCLUSIVE TAX (GST added on top)
  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const taxAmount = Math.round(afterDiscount * (taxPercent / 100));
  const total = afterDiscount + taxAmount;

  return {
    subtotal,
    taxPercent,
    taxAmount,
    discountType: (discountType as 'percentage' | 'fixed' | null) || null,
    discountValue: Math.round(discountValue),
    discountAmount,
    total,
    taxInclusive: false,
  };
}