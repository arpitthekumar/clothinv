"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { normalizeItems } from "@/lib/json";
import { toZonedTime, format } from "date-fns-tz";

interface SalesTableProps {
  sales: any[];
  loading: boolean;
  products: any[];
}

export default function SalesTable({
  sales,
  loading,
  products,
}: SalesTableProps) {
  // ✅ Map for quick product lookup
  const productMap = useMemo(() => {
    const map: Record<string, any> = {};
    for (const p of products || []) {
      if (p?.id) map[p.id] = p;
    }
    return map;
  }, [products]);

  // ✅ Format numbers with Indian commas (no decimals)
  const formatIN = (num: number) =>
    num.toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

  // ✅ Convert UTC → IST and format time properly
  const formatISTDateTime = (createdAt: string | Date) => {
    const createdAtRaw =
      typeof createdAt === "string"
        ? createdAt.replace(" ", "T")
        : createdAt || new Date();

    // Parse as UTC explicitly
    const utcDate = new Date(createdAtRaw + "Z");
    const istDate = toZonedTime(utcDate, "Asia/Kolkata");

    // Format for IST (dd/MM/yyyy)
    const formattedDate = format(istDate, "dd/MM/yyyy", {
      timeZone: "Asia/Kolkata",
    });

    // 12-hour format manually (no AM/PM)
    let hour = istDate.getHours();
    const minute = istDate.getMinutes().toString().padStart(2, "0");
    if (hour > 12) hour -= 12;
    if (hour === 0) hour = 12;
    const formattedTime = `${hour}:${minute}`;

    return { formattedDate, formattedTime };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Buy Cost</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Profit</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No sales data available
                    </TableCell>
                  </TableRow>
                ) : (
                  sales.map((sale) => {
                    const items = normalizeItems(sale.items);
                    const itemCount = items.reduce(
                      (sum: number, item: any) =>
                        sum + (Number(item?.quantity) || 0),
                      0
                    );

                    const revenue = Number(sale.total_amount || 0);
                    let cost = 0;

                    const itemSummary = items
                      .map((item: any) => {
                        const qty = Number(item?.quantity || 0);
                        const prod = productMap[item?.productId];
                        const costPerUnit = prod
                          ? Number(prod.buyingPrice ?? prod.price ?? 0)
                          : Number(item?.cost || 0);
                        cost += qty * costPerUnit;
                        const displayName =
                          item?.name || prod?.name || "Product";
                        return `${displayName} ×${qty}`;
                      })
                      .join(", ");

                    const profit = revenue - cost;

                    // ✅ Use correct IST date & time formatting
                    const { formattedDate, formattedTime } = formatISTDateTime(
                      sale.created_at
                    );

                    return (
                      <TableRow key={sale.id}>
                        {/* Invoice Number */}
                        <TableCell>{sale.invoice_number}</TableCell>

                        {/* Date & Time */}
                        <TableCell>
                          <p className="text-sm font-medium">
                            {formattedDate}, {formattedTime}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {(() => {
                              try {
                                const raw = sale.created_at || new Date();
                                const utcDate = new Date(
                                  typeof raw === "string"
                                    ? raw.replace(" ", "T") + "Z"
                                    : raw
                                );
                                const istDate = toZonedTime(
                                  utcDate,
                                  "Asia/Kolkata"
                                );

                                return formatDistanceToNow(istDate, {
                                  addSuffix: true,
                                });
                              } catch {
                                return "Invalid date";
                              }
                            })()}
                          </p>
                        </TableCell>

                        {/* Items */}
                        <TableCell>
                          <div className="text-sm font-medium">
                            {itemCount} items
                          </div>
                          {itemSummary && (
                            <p
                              className="text-xs text-muted-foreground max-w-xs truncate"
                              title={itemSummary}
                            >
                              {itemSummary}
                            </p>
                          )}
                        </TableCell>

                        {/* Buy Cost */}
                        <TableCell>₹{formatIN(cost)}</TableCell>

                        {/* Revenue */}
                        <TableCell>₹{formatIN(revenue)}</TableCell>

                        {/* Profit */}
                        <TableCell>
                          <span
                            className={
                              profit >= 0
                                ? "text-green-600 font-semibold"
                                : "text-red-600 font-semibold"
                            }
                          >
                            ₹{formatIN(profit)}
                          </span>
                        </TableCell>

                        {/* Payment */}
                        <TableCell>
                          <Badge variant="outline">
                            {sale.payment_method || "Other"}
                          </Badge>
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <Badge
                            variant="default"
                            className="bg-green-100 text-green-800"
                          >
                            Completed
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
