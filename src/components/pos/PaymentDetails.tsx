"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Zap, Tag, Percent, DollarSign, UserCheck, Edit2, RotateCcw } from "lucide-react";

import { AllowedDiscountModes } from "@/lib/pos-checkout-prefs";

interface PaymentDetailsProps {
  paymentMethod: string;
  onChangePaymentMethod: (v: string) => void;
  customerName: string;
  onChangeCustomerName: (v: string) => void;
  customerPhone: string;
  onChangeCustomerPhone: (v: string) => void;
  salespersonId?: string;
  onChangeSalespersonId?: (v: string) => void;
  salespersons?: Array<{ id: string; name: string; active?: boolean }>;
  couponCode: string;
  onChangeCouponCode: (v: string) => void;
  hasAppliedCoupon: boolean;
  onApplyCoupon: () => void;
  onRemoveCoupon: () => void;

  // Custom Discount Props
  customDiscountType?: "none" | "coupon" | "custom_flat" | "custom_percent";
  onChangeCustomDiscountType?: (type: "none" | "coupon" | "custom_flat" | "custom_percent") => void;
  customDiscountValue?: string;
  onChangeCustomDiscountValue?: (val: string) => void;
  allowedDiscountModes?: AllowedDiscountModes;

  // Customer Match Props
  matchedCustomerName?: string | null;
  onRestoreMatchedName?: () => void;
}

export function PaymentDetails({
  paymentMethod,
  onChangePaymentMethod,
  customerName,
  onChangeCustomerName,
  customerPhone,
  onChangeCustomerPhone,
  salespersonId = "",
  onChangeSalespersonId,
  salespersons = [],
  couponCode,
  onChangeCouponCode,
  hasAppliedCoupon,
  onApplyCoupon,
  onRemoveCoupon,
  customDiscountType = "none",
  onChangeCustomDiscountType,
  customDiscountValue = "",
  onChangeCustomDiscountValue,
  allowedDiscountModes = "all",
  matchedCustomerName,
  onRestoreMatchedName,
}: PaymentDetailsProps) {
  const activeDiscountMode = hasAppliedCoupon
    ? "coupon"
    : customDiscountType;

  const showCoupon = allowedDiscountModes === "all" || allowedDiscountModes === "coupon_only" || allowedDiscountModes === "percentage_and_coupon";
  const showFlat = allowedDiscountModes === "all" || allowedDiscountModes === "fixed_only";
  const showPercent = allowedDiscountModes === "all" || allowedDiscountModes === "percentage_only" || allowedDiscountModes === "percentage_and_coupon";

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">Payment Method</label>
        <Select value={paymentMethod} onValueChange={onChangePaymentMethod}>
          <SelectTrigger data-testid="select-payment-method">
            <SelectValue placeholder="Select method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cash">Cash</SelectItem>
            <SelectItem value="upi">UPI</SelectItem>
            <SelectItem value="card">Card</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <UserCheck className="h-4 w-4 text-primary" />
            Sales Person
          </span>
        </label>
        <Select value={salespersonId || "none"} onValueChange={(val) => onChangeSalespersonId?.(val === "none" ? "" : val)}>
          <SelectTrigger data-testid="select-salesperson">
            <SelectValue placeholder="Select Sales Person" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">-- None / Counter --</SelectItem>
            {salespersons
              .filter((sp) => sp.active !== false)
              .map((sp) => (
                <SelectItem key={sp.id} value={sp.id}>
                  👤 {sp.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {(() => {
        const nameTrim = customerName.trim();
        const phoneTrim = customerPhone.trim();
        const phoneDigits = phoneTrim.replace(/\D/g, "");

        const isQuickFilled =
          nameTrim === "Walk-in Customer" || phoneTrim === "0000000000";

        const handleNameFocus = () => {
          if (isQuickFilled) {
            onChangeCustomerName("");
            onChangeCustomerPhone("");
          }
        };

        const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          let val = e.target.value;
          if (isQuickFilled) {
            onChangeCustomerPhone("");
            val = val.replace("Walk-in Customer", "").trim();
          }
          onChangeCustomerName(val);
        };

        const handlePhoneFocus = () => {
          if (isQuickFilled) {
            onChangeCustomerName("");
            onChangeCustomerPhone("");
          }
        };

        const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          if (isQuickFilled) {
            onChangeCustomerName("");
          }
          let raw = e.target.value.replace(/\D/g, "");
          if (phoneTrim === "0000000000") {
            raw = raw.replace(/^0+/, "");
          }
          if (raw.length === 12 && raw.startsWith("91")) {
            raw = raw.slice(2);
          }
          const cleaned = raw.slice(0, 10);
          onChangeCustomerPhone(cleaned);
        };

        let phoneError = "";
        let nameError = "";
        let isInitialBlank = nameTrim === "" && phoneTrim === "";

        if (isInitialBlank) {
          // Subtle initial prompt, handled via helper tip badge below
        } else if (
          phoneTrim.length > 0 &&
          phoneTrim !== "0000000000" &&
          phoneTrim !== "N/A" &&
          phoneDigits.length !== 10
        ) {
          phoneError = `Enter valid 10-digit phone number (${phoneDigits.length}/10 digits).`;
        } else if (
          nameTrim.length > 0 &&
          nameTrim !== "Walk-in Customer" &&
          (phoneTrim === "" || phoneTrim === "0000000000")
        ) {
          phoneError = "10-digit phone number required for custom customer.";
        } else if (
          phoneDigits.length === 10 &&
          phoneTrim !== "0000000000" &&
          (nameTrim === "" || nameTrim === "Walk-in Customer")
        ) {
          nameError = "Customer name required for custom phone.";
        }

        return (
          <>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium block">Customer Name</label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={`h-7 text-xs transition-all font-medium ${
                    isQuickFilled
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-primary/10 border-primary/20 text-primary hover:bg-primary/20"
                  }`}
                  onClick={() => {
                    onChangeCustomerName("Walk-in Customer");
                    onChangeCustomerPhone("0000000000");
                  }}
                >
                  <Zap className="h-3 w-3 mr-1 fill-current" />
                  Quick Fill
                </Button>
              </div>
              <Input
                placeholder="Full name (or click Quick Fill)"
                value={customerName}
                onFocus={handleNameFocus}
                onChange={handleNameChange}
                maxLength={30}
                data-testid="input-customer-name"
                className={nameError ? "border-destructive ring-1 ring-destructive" : ""}
              />
              {nameError ? (
                <p className="text-xs text-destructive mt-1 font-medium flex items-center gap-1">
                  <span>⚠️</span> {nameError}
                </p>
              ) : matchedCustomerName ? (
                customerName.trim() === matchedCustomerName ? (
                  <div className="mt-1.5 p-2 rounded-md bg-blue-500/10 border border-blue-500/20 text-xs text-blue-600 dark:text-blue-400 font-medium flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5">
                      <UserCheck className="h-3.5 w-3.5 shrink-0" />
                      Client already exists ({matchedCustomerName}). Name auto-filled.
                    </span>
                  </div>
                ) : (
                  <div className="mt-1.5 p-2 rounded-md bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5">
                      <Edit2 className="h-3.5 w-3.5 shrink-0" />
                      Overwriting name (&quot;{matchedCustomerName}&quot; → &quot;{customerName}&quot;).
                    </span>
                    {onRestoreMatchedName && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-[11px] hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-semibold shrink-0 gap-1"
                        onClick={onRestoreMatchedName}
                      >
                        <RotateCcw className="h-3 w-3" />
                        Restore &quot;{matchedCustomerName}&quot;
                      </Button>
                    )}
                  </div>
                )
              ) : null}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium block">Customer Phone</label>
                {phoneDigits.length > 0 && phoneTrim !== "0000000000" && (
                  <span className={`text-xs font-mono font-medium ${phoneDigits.length === 10 ? "text-emerald-500" : "text-amber-500"}`}>
                    {phoneDigits.length === 10 ? "✓ 10/10 digits" : `${phoneDigits.length}/10 digits`}
                  </span>
                )}
              </div>
              <div
                className={`flex items-center border rounded-md overflow-hidden transition-colors ${
                  phoneError ? "border-destructive ring-1 ring-destructive" : ""
                }`}
              >
                <span className="px-3 text-muted-foreground bg-muted border-r border-border font-medium text-xs">+91</span>
                <Input
                  type="tel"
                  placeholder="10-digit Phone number"
                  value={customerPhone}
                  onFocus={handlePhoneFocus}
                  onChange={handlePhoneChange}
                  maxLength={10}
                  data-testid="input-customer-phone"
                  className="border-0 focus:ring-0 focus:outline-none flex-1 font-mono tracking-wide"
                />
              </div>

              {phoneError ? (
                <p className="text-xs text-destructive mt-1.5 font-medium flex items-center gap-1">
                  <span>⚠️</span> {phoneError}
                </p>
              ) : isQuickFilled ? (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1.5 font-medium flex items-center gap-1">
                  <span>✨</span> Quick Fill active (Walk-in Customer)
                </p>
              ) : null}
            </div>
          </>
        );
      })()}

      {/* DUAL DISCOUNT SECTION */}
      {(showCoupon || showFlat || showPercent) && (
        <div className="space-y-2 pt-1 border-t">
          <label className="text-sm font-medium block">Cart Discount</label>

          <div className="flex gap-1 bg-muted p-1 rounded-md text-xs">
            {showCoupon && (
              <button
                type="button"
                className={`flex-1 py-1.5 px-2 rounded-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                  activeDiscountMode === "coupon"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => {
                  onChangeCustomDiscountType?.("coupon");
                  if (customDiscountType !== "coupon") {
                    onChangeCustomDiscountValue?.("");
                  }
                }}
              >
                <Tag className="h-3 w-3" />
                Coupon Code
              </button>
            )}

            {showFlat && (
              <button
                type="button"
                className={`flex-1 py-1.5 px-2 rounded-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                  activeDiscountMode === "custom_flat"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => {
                  if (hasAppliedCoupon) onRemoveCoupon();
                  onChangeCustomDiscountType?.("custom_flat");
                }}
              >
                <DollarSign className="h-3 w-3" />
                Custom ₹
              </button>
            )}

            {showPercent && (
              <button
                type="button"
                className={`flex-1 py-1.5 px-2 rounded-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                  activeDiscountMode === "custom_percent"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => {
                  if (hasAppliedCoupon) onRemoveCoupon();
                  onChangeCustomDiscountType?.("custom_percent");
                }}
              >
                <Percent className="h-3 w-3" />
                Custom %
              </button>
            )}
          </div>

        {/* DISCOUNT INPUT FIELD */}
        {activeDiscountMode === "coupon" && (
          <div className="flex gap-2 pt-1">
            <Input 
              placeholder="Enter coupon code" 
              value={couponCode} 
              onChange={(e) => onChangeCouponCode(e.target.value)} 
              disabled={hasAppliedCoupon} 
            />
            {hasAppliedCoupon ? (
              <Button variant="outline" onClick={onRemoveCoupon}>Remove</Button>
            ) : (
              <Button variant="outline" onClick={onApplyCoupon}>Apply</Button>
            )}
          </div>
        )}

        {activeDiscountMode === "custom_flat" && (
          <div className="flex gap-2 pt-1">
            <div className="relative flex-1">
              <span className="absolute left-3 top-2.5 text-xs text-muted-foreground font-semibold">₹</span>
              <Input
                type="number"
                step="1"
                placeholder="Discount amount (₹)"
                value={customDiscountValue}
                onChange={(e) => onChangeCustomDiscountValue?.(e.target.value)}
                className="pl-7"
              />
            </div>
            {customDiscountValue && (
              <Button 
                variant="ghost" 
                onClick={() => onChangeCustomDiscountValue?.("")}
              >
                Clear
              </Button>
            )}
          </div>
        )}

        {activeDiscountMode === "custom_percent" && (
          <div className="flex gap-2 pt-1">
            <div className="relative flex-1">
              <Input
                type="number"
                step="0.5"
                placeholder="Discount percentage (%)"
                value={customDiscountValue}
                onChange={(e) => onChangeCustomDiscountValue?.(e.target.value)}
                className="pr-7"
              />
              <span className="absolute right-3 top-2.5 text-xs text-muted-foreground font-semibold">%</span>
            </div>
            {customDiscountValue && (
              <Button 
                variant="ghost" 
                onClick={() => onChangeCustomDiscountValue?.("")}
              >
                Clear
              </Button>
            )}
          </div>
        )}
      </div>
    )}
  </div>
);
}
