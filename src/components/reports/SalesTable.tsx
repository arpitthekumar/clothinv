"use client";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { normalizeItems } from "@/lib/json";

export default function SalesTable({ sales, loading }: { sales: any[]; loading: boolean }) {
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
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No sales data available
                    </TableCell>
                  </TableRow>
                ) : (
                  sales.map((sale) => {
                    const items = normalizeItems(sale.items);
                    const itemCount = items.reduce(
                      (sum: number, item: any) => sum + (item?.quantity || 0),
                      0
                    );
                    return (
                      <TableRow key={sale.id}>
                        <TableCell>{sale.invoice_number}</TableCell>
                        <TableCell>
                          {sale.created_at ? (
                            <>
                              <p className="text-sm font-medium">
                                {new Date(sale.created_at).toLocaleString("en-IN", {
                                  hour12: true,
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                })}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(sale.created_at), { addSuffix: true })}
                              </p>
                            </>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>{itemCount} items</TableCell>
                        <TableCell>₹{Math.round(Number(sale.total_amount || 0)).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{sale.payment_method || "Other"}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="default" className="bg-green-100 text-green-800">
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
