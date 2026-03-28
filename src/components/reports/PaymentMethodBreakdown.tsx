"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Banknote, CreditCard, Smartphone, Wallet } from "lucide-react";
import type { PaymentMethodKey } from "@/lib/payment-breakdown";

interface PaymentMethodBreakdownProps {
  totals: Record<PaymentMethodKey, number>;
  dateRangeLabel: string;
}

const ROWS: {
  key: PaymentMethodKey;
  label: string;
  icon: typeof Banknote;
  amountClass: string;
  iconWrapClass: string;
}[] = [
  {
    key: "cash",
    label: "Cash",
    icon: Banknote,
    amountClass: "text-emerald-600",
    iconWrapClass: "bg-emerald-100",
  },
  {
    key: "upi",
    label: "UPI",
    icon: Smartphone,
    amountClass: "text-sky-600",
    iconWrapClass: "bg-sky-100",
  },
  {
    key: "card",
    label: "Card",
    icon: CreditCard,
    amountClass: "text-indigo-600",
    iconWrapClass: "bg-indigo-100",
  },
  {
    key: "other",
    label: "Other",
    icon: Wallet,
    amountClass: "text-amber-700",
    iconWrapClass: "bg-amber-100",
  },
];

export default function PaymentMethodBreakdown({
  totals,
  dateRangeLabel,
}: PaymentMethodBreakdownProps) {
  const formatIN = (num: number) =>
    num.toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

  const sum = ROWS.reduce((acc, { key }) => acc + (totals[key] || 0), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales by payment method ({dateRangeLabel})</CardTitle>
        <p className="text-sm text-muted-foreground font-normal">
          Totals match the date range above; each sale is counted once by its
          payment type.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ROWS.map(({ key, label, icon: Icon, amountClass, iconWrapClass }) => {
            const amount = totals[key] || 0;
            const pct = sum > 0 ? Math.round((amount / sum) * 1000) / 10 : 0;
            return (
              <div
                key={key}
                className="flex items-center justify-between rounded-lg border p-4 gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-muted-foreground">
                    {label}
                  </p>
                  <p className={`text-xl font-bold tabular-nums ${amountClass}`}>
                    ₹{formatIN(amount)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {sum > 0 ? `${pct}% of period sales` : "—"}
                  </p>
                </div>
                <div
                  className={`shrink-0 w-11 h-11 rounded-lg flex items-center justify-center ${iconWrapClass}`}
                >
                  <Icon className={`h-5 w-5 ${amountClass}`} />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
