"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Edit2, AlertTriangle, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CartItemUI {
  id: string;
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  price: string;
  stock: number;
  isBargainable?: boolean;
  minPrice?: string | number | null;
  buyingPrice?: string | number | null;
  customUnitPrice?: number | null;
}

interface CartTableProps {
  items: CartItemUI[];
  onDecrease: (productId: string) => void;
  onIncrease: (productId: string) => void;
  onRemove: (productId: string) => void;
  onUpdatePrice?: (productId: string, customPrice: number | null) => void;

  getDiscountedUnitPrice?: (productId: string, basePrice: number) => number;

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
  onUpdatePrice,
  getDiscountedUnitPrice,
  getFinalUnitPrice,
  subtotal,
  couponDiscount,
}: CartTableProps) {
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<string>("");
  const { toast } = useToast();

  const formatIN = (num: number | null | undefined) =>
    (typeof num === "number" && !isNaN(num) ? num : 0).toLocaleString("en-IN", {
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
        const baseUnit = Math.round(item.customUnitPrice ?? parseFloat(item.price));

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

        const lineList = Math.round(parseFloat(item.price)) * item.quantity;
        const lineCharged = unitCharged * item.quantity;
        const lineSave = lineList - lineCharged;

        const hasPromo = lineSave > 0.01;
        const minPriceNum = item.minPrice ? Math.round(parseFloat(String(item.minPrice))) : null;
        const buyingPriceNum = item.buyingPrice ? Math.round(parseFloat(String(item.buyingPrice))) : null;
        const minAllowed = (minPriceNum != null || buyingPriceNum != null)
          ? Math.max(minPriceNum ?? 0, buyingPriceNum ?? 0)
          : null;

        const isBelowMin = minAllowed != null && unitCharged < minAllowed;

        const discountPercent =
          hasPromo && lineList > 0
            ? Math.round((lineSave / lineList) * 100)
            : 0;

        const handleSavePrice = () => {
          const val = Math.round(parseFloat(tempPrice));
          if (!isNaN(val) && val >= 0) {
            if (minAllowed != null && val < minAllowed) {
              toast({
                title: "Price Too Low",
                description: `Price cannot be set lower than minimum allowed price (₹${formatIN(minAllowed)})`,
                variant: "destructive",
              });
              return;
            }
            const originalPrice = Math.round(parseFloat(item.price));
            onUpdatePrice?.(item.productId, val === originalPrice ? null : val);
          }
          setEditingPriceId(null);
        };

        return (
          <div
            key={item.id}
            className="group rounded-xl border bg-background p-4 transition hover:shadow-sm"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

              {/* LEFT */}
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-semibold text-sm md:text-base leading-tight">
                    {item.name}
                  </h4>
                  {item.isBargainable && (
                    <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200">
                      Bargainable
                    </Badge>
                  )}
                </div>

                <p className="text-xs text-muted-foreground">
                  SKU: {item.sku}
                </p>

                {/* PRICE EDIT / DISPLAY */}
                {editingPriceId === item.productId ? (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="text-xs font-semibold">₹</span>
                    <Input
                      type="number"
                      step="1"
                      className="h-7 w-28 text-xs px-2"
                      autoFocus
                      value={tempPrice}
                      onChange={(e) => setTempPrice(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSavePrice();
                        if (e.key === "Escape") setEditingPriceId(null);
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-green-600 hover:bg-green-50"
                      onClick={handleSavePrice}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm flex-wrap mt-1">
                    {hasPromo ? (
                      <>
                        <span className="line-through text-muted-foreground">
                          ₹{formatIN(Math.round(parseFloat(item.price)))}
                        </span>
                        <span className="text-green-600 font-semibold">
                          ₹{formatIN(unitCharged)}
                        </span>
                        <span className="text-xs text-muted-foreground">per item</span>
                      </>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        ₹{formatIN(baseUnit)} × {item.quantity}
                      </div>
                    )}

                    {item.isBargainable && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-1.5 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950"
                        onClick={() => {
                          setEditingPriceId(item.productId);
                          setTempPrice(String(Math.round(baseUnit)));
                        }}
                      >
                        <Edit2 className="h-3 w-3 mr-1" />
                        Edit Price
                      </Button>
                    )}
                  </div>
                )}

                {/* BADGES: STOCK, SAVINGS, MIN PRICE ALERT */}
                <div className="flex items-center gap-2 flex-wrap pt-0.5">
                  <Badge variant="outline" className="text-xs">
                    {item.stock} in stock
                  </Badge>

                  {hasPromo && (
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300 text-xs">
                      Save ₹{formatIN(lineSave)} ({discountPercent}%)
                    </Badge>
                  )}

                  {isBelowMin && (
                    <Badge className="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 text-xs flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Below Min Price (₹{formatIN(minAllowed)})
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