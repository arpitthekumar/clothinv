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
  const productMap = useMemo(() => {
    const map: Record<string, any> = {};
    for (const p of products || []) {
      if (p?.id) map[p.id] = p;
    }
    return map;
  }, [products]);

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
                      colSpan={7}
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
                    return (
                      <TableRow key={sale.id}>
                        <TableCell>{sale.invoice_number}</TableCell>
                        <TableCell>
                          {sale.created_at ? (
                            <>
                              <p className="text-sm font-medium">
                                {(() => {
                                  const date = new Date(sale.created_at);

                                  // 12-hour format but strip AM/PM manually
                                  let formatted = date.toLocaleString("en-IN", {
                                    hour12: true,
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                  });

                                  // Remove AM/PM text
                                  formatted = formatted
                                    .replace(/ ?(AM|PM)/i, "")
                                    .trim();

                                  return formatted;
                                })()}
                              </p>

                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(
                                  new Date(sale.created_at),
                                  { addSuffix: true }
                                )}
                              </p>
                            </>
                          ) : (
                            "—"
                          )}
                        </TableCell>

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
                        <TableCell>₹{cost.toFixed(2)}</TableCell>
                        <TableCell>₹{revenue.toFixed(2)}</TableCell>
                        <TableCell>
                          <span
                            className={
                              profit >= 0
                                ? "text-green-600 font-semibold"
                                : "text-red-600 font-semibold"
                            }
                          >
                            ₹{profit.toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {sale.payment_method || "Other"}
                          </Badge>
                        </TableCell>
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
