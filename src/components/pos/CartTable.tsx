"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CartItemUI {
  id: string;
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  price: string;
  stock: number;
}

interface CartTableProps {
  items: CartItemUI[];
  onDecrease: (productId: string) => void;
  onIncrease: (productId: string) => void;
  onRemove: (productId: string) => void;

  getDiscountedUnitPrice?: (productId: string, basePrice: number) => number;

  // ✅ ADD THESE
  getFinalUnitPrice?: (
    productId: string,
    basePrice: number,
    quantity: number,
    subtotal: number,
    couponDiscount: number
  ) => number;

  subtotal?: number;
  couponDiscount?: number;
}

export function CartTable({
  items,
  onDecrease,
  onIncrease,
  onRemove,
  getDiscountedUnitPrice,
   getFinalUnitPrice,   // ✅ ADD
  subtotal,            // ✅ ADD
  couponDiscount,      // ✅ ADD
}: CartTableProps) {
  const formatIN = (num: number) =>
    num.toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Cart is empty</p>
        <p className="text-sm text-muted-foreground">
          Scan or search for products to add them
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const baseUnit = parseFloat(item.price);

        const productPrice = getDiscountedUnitPrice
          ? getDiscountedUnitPrice(item.productId, baseUnit)
          : baseUnit;

        const unitCharged =
          getFinalUnitPrice && subtotal !== undefined && couponDiscount !== undefined
            ? getFinalUnitPrice(
              item.productId,
              baseUnit,
              item.quantity,
              subtotal,
              couponDiscount
            )
            : productPrice;

        const lineList = baseUnit * item.quantity;
        const lineCharged = unitCharged * item.quantity;
        const lineSave = lineList - lineCharged;

        const hasPromo = lineSave > 0.01;

        const discountPercent =
          hasPromo && lineList > 0
            ? Math.round((lineSave / lineList) * 100)
            : 0;

        return (
          <div
            key={item.id}
            className="group rounded-xl border bg-background p-4 transition hover:shadow-sm"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

              {/* LEFT */}
              <div className="flex-1 space-y-1">
                <h4 className="font-semibold text-sm md:text-base leading-tight">
                  {item.name}
                </h4>

                <p className="text-xs text-muted-foreground">
                  SKU: {item.sku}
                </p>

                {/* PRICE */}
                {hasPromo ? (
                  <div className="flex items-center gap-2 text-sm flex-wrap">
                    <span className="line-through text-muted-foreground">
                      ₹{formatIN(baseUnit)}
                    </span>

                    <span className="text-green-600 font-semibold">
                      ₹{formatIN(unitCharged)}
                    </span>

                    <span className="text-xs text-muted-foreground">
                      per item
                    </span>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    ₹{formatIN(baseUnit)} × {item.quantity}
                  </div>
                )}

                {/* STOCK + SAVE */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs">
                    {item.stock} in stock
                  </Badge>

                  {hasPromo && (
                    <Badge className="bg-green-100 text-green-700 text-xs">
                      Save ₹{formatIN(lineSave)} ({discountPercent}%)
                    </Badge>
                  )}
                </div>
              </div>

              {/* CENTER - QUANTITY */}
              <div className="flex items-center justify-between md:justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => onDecrease(item.productId)}
                >
                  -
                </Button>

                <span className="w-8 text-center font-semibold">
                  {item.quantity}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => onIncrease(item.productId)}
                >
                  +
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground hover:text-red-500"
                  onClick={() => onRemove(item.productId)}
                >
                  Remove
                </Button>
              </div>

              {/* RIGHT - TOTAL */}
              <div className="text-right min-w-[110px]">
                {hasPromo ? (
                  <>
                    <p className="text-xs line-through text-muted-foreground">
                      ₹{formatIN(lineList)}
                    </p>

                    <p className="text-green-600 font-bold text-lg">
                      ₹{formatIN(lineCharged)}
                    </p>
                  </>
                ) : (
                  <p className="font-semibold text-lg">
                    ₹{formatIN(lineCharged)}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}