"use client";

interface TotalsPanelProps {
  /** Sum of list / regular prices × qty (before product promos). */
  listSubtotal?: number;
  /** Amount saved from product/promo pricing vs list total. */
  promoSavings?: number;
  subtotal: number;
  couponDiscount: number;
  tax: number;
  total: number;
}

export function TotalsPanel({
  listSubtotal = 0,
  promoSavings = 0,
  subtotal,
  couponDiscount,
  tax,
  total,
}: TotalsPanelProps) {
  // ✅ Format function (Indian commas, no decimals)
  const formatIN = (num: number) =>
    num.toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

  const showPromoBreakdown = promoSavings > 0.005;

  return (
    <div className="space-y-2">
      {showPromoBreakdown && (
        <>
          <div className="flex justify-between text-muted-foreground">
            <span>Regular (list) total:</span>
            <span className="line-through decoration-muted-foreground/80">
              ₹{formatIN(listSubtotal)}
            </span>
          </div>
          <div className="flex justify-between text-green-600 dark:text-green-500">
            <span>Promo / product discount:</span>
            <span>-₹{formatIN(promoSavings)}</span>
          </div>
        </>
      )}

      <div className="flex justify-between">
        <span>{showPromoBreakdown ? "Subtotal (after promos):" : "Subtotal:"}</span>
        <span data-testid="text-subtotal">₹{formatIN(subtotal)}</span>
      </div>

      {couponDiscount > 0 && (
        <div className="flex justify-between text-green-600 dark:text-green-500">
          <span>Coupon discount:</span>
          <span>-₹{formatIN(couponDiscount)}</span>
        </div>
      )}

      {tax > 0 && (
        <div className="flex justify-between">
          <span>Tax:</span>
          <span>₹{formatIN(tax)}</span>
        </div>
      )}

      <div className="flex justify-between text-lg font-bold pt-1 border-t">
        <span>Total to pay:</span>
        <span data-testid="text-total">₹{formatIN(total)}</span>
      </div>
    </div>
  );
}
