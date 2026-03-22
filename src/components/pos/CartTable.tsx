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
  /** When set, shows regular vs discounted unit price and line savings. */
  getDiscountedUnitPrice?: (productId: string, basePrice: number) => number;
}

export function CartTable({
  items,
  onDecrease,
  onIncrease,
  onRemove,
  getDiscountedUnitPrice,
}: CartTableProps) {
  // ✅ Format numbers using Indian comma system (no decimals)
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
    <div className="space-y-3 md:space-y-4">
      {items.map((item) => {
        const baseUnit = parseFloat(item.price);
        const unitCharged = getDiscountedUnitPrice
          ? getDiscountedUnitPrice(item.productId, baseUnit)
          : baseUnit;
        const lineList = Math.round(baseUnit * item.quantity * 100) / 100;
        const lineCharged =
          Math.round(unitCharged * item.quantity * 100) / 100;
        const lineSave = Math.round((lineList - lineCharged) * 100) / 100;
        const hasPromo = lineSave > 0.005;

        return (
          <div
            key={item.id}
            className="flex sm:flex-col flex-col md:flex-row md:items-center justify-between gap-3 border-b pb-3 md:pb-4"
          >
            {/* Product Info */}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium truncate">{item.name}</h4>
              <p className="text-sm text-muted-foreground">
                SKU: {item.sku}
                {getDiscountedUnitPrice ? (
                  <>
                    {" "}
                    •{" "}
                    {hasPromo ? (
                      <>
                        <span className="line-through opacity-80">
                          ₹{formatIN(baseUnit)}
                        </span>
                        {" → "}
                        <span className="text-foreground font-medium">
                          ₹{formatIN(unitCharged)}
                        </span>
                        {" each "}
                        <span className="text-xs">
                          (× {item.quantity}{" "}
                          {item.quantity === 1 ? "pc" : "pcs"})
                        </span>
                        {lineSave > 0 && (
                          <span className="ml-1 text-green-600 dark:text-green-500">
                            · Save ₹{formatIN(lineSave)}
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        ₹{formatIN(baseUnit)} each (× {item.quantity}{" "}
                        {item.quantity === 1 ? "pc" : "pcs"})
                      </>
                    )}
                  </>
                ) : (
                  <> • ₹{formatIN(baseUnit)}</>
                )}
              </p>
              <Badge variant="outline" className="mt-1">
                {item.stock} in stock
              </Badge>
            </div>

            {/* Quantity Controls */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDecrease(item.productId)}
              >
                -
              </Button>
              <span className="w-10 md:w-12 text-center font-medium">
                {item.quantity}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onIncrease(item.productId)}
              >
                +
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRemove(item.productId)}
              >
                Remove
              </Button>
            </div>

            {/* Total Price */}
            <div className="text-right ml-2 md:ml-4 min-w-[100px]">
              {hasPromo && getDiscountedUnitPrice && (
                <p className="text-xs text-muted-foreground line-through">
                  ₹{formatIN(lineList)}
                </p>
              )}
              <p className="font-medium">₹{formatIN(lineCharged)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
