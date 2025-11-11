"use client";

interface TotalsPanelProps {
  subtotal: number;
  couponDiscount: number;
  tax: number;
  total: number;
}

export function TotalsPanel({ subtotal, couponDiscount, tax, total }: TotalsPanelProps) {
  // ✅ Format function (Indian commas, no decimals)
  const formatIN = (num: number) =>
    num.toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <span>Subtotal:</span>
        <span data-testid="text-subtotal">₹{formatIN(subtotal)}</span>
      </div>

      {couponDiscount > 0 && (
        <div className="flex justify-between text-green-600">
          <span>Coupon Discount:</span>
          <span>-₹{formatIN(couponDiscount)}</span>
        </div>
      )}

      <div className="flex justify-between text-lg font-bold">
        <span>Total:</span>
        <span data-testid="text-total">₹{formatIN(total)}</span>
      </div>
    </div>
  );
}
