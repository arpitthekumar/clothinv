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
  // Calculate subtotal
  const subtotal = items.reduce((sum, item) => {
    const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
    return sum + (price * item.quantity);
  }, 0);

  // Calculate discount
  const discountAmount = discountType === 'percentage'
    ? subtotal * (discountValue / 100)
    : discountType === 'fixed'
    ? discountValue
    : 0;

  // Amount after discount
  const afterDiscount = subtotal - discountAmount;

  // Calculate tax (18% GST)
  const taxPercent = 18;
  const taxAmount = afterDiscount * (taxPercent / 100);

  // Calculate final total
  const total = afterDiscount + taxAmount;

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