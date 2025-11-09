import { SaleItem } from "@shared/schema";

interface SaleCalculation {
  subtotal: number;
  taxPercent: number;
  taxAmount: number;
  discountType?: 'percentage' | 'fixed' | null;
  discountValue: number;
  discountAmount: number;
  total: number;
}

export function calculateSaleTotals(items: Array<{ quantity: number; price: string | number }>, discountType?: string | null, discountValue: number = 0): SaleCalculation {
  // Calculate subtotal (rounded)
  const subtotal = Math.round(items.reduce((sum, item) => {
    const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
    return sum + (price * item.quantity);
  }, 0) * 100) / 100;

  // Calculate discount (rounded)
  const discountAmount = discountType === 'percentage'
    ? Math.round(subtotal * (discountValue / 100) * 100) / 100
    : discountType === 'fixed'
    ? Math.round(discountValue * 100) / 100
    : 0;

  // Amount after discount
  const afterDiscount = Math.round((subtotal - discountAmount) * 100) / 100;

  // Calculate tax (0% - GST removed)
  const taxPercent = 0;
  const taxAmount = 0;

  // Calculate final total (rounded)
  const total = Math.round((afterDiscount + taxAmount) * 100) / 100;

  return {
    subtotal,
    taxPercent,
    taxAmount,
    discountType: (discountType as 'percentage' | 'fixed' | null) || null,
    discountValue,
    discountAmount,
    total
  };
}