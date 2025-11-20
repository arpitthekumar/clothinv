//#region Path src/components/sales/SalesCard.tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { RotateCcw, Trash2, XCircle, User, Package } from "lucide-react";
import { normalizeItems } from "@/lib/json";
import { formatDistanceToNow } from "date-fns";
import { toZonedTime } from "date-fns-tz";

export default function SalesCard({
  sale,
  onDelete,
  onRestore,
  onPermanentDelete,
  onReturn,
  onPrint,
  isSystemAdmin,
}: any) {
  const createdDate = (() => {
    try {
      const utcDate = new Date((sale.created_at || "").replace(" ", "T") + "Z");
      return formatDistanceToNow(toZonedTime(utcDate, "Asia/Kolkata"), {
        addSuffix: true,
      });
    } catch {
      return "Invalid date";
    }
  })();
  function getPaymentColor(method: string = "") {
    switch (method.toLowerCase()) {
      case "upi":
        return "text-green-600";
      case "cash":
        return "text-yellow-600";
      case "card":
        return "text-blue-600";
      case "credit":
        return "text-purple-600";
      case "bank":
        return "text-orange-600";
      default:
        return "text-gray-600";
    }
  }

  return (
    <div className="border rounded-lg p-4">
      {/* Header */}
      <div className="flex justify-between mb-3">
        <div>
          <h3 className="font-semibold">{sale.invoice_number}</h3>
          <p className="text-sm text-muted-foreground">{createdDate}</p>
          <Badge variant={sale.deleted ? "destructive" : "default"}>
            {sale.deleted ? "Deleted" : "Active"}
          </Badge>
        </div>

        <div className="text-right">
          <p className="font-semibold">
            ₹
            {Number(sale.total_amount || 0).toLocaleString("en-IN", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}
          </p>
          <p
            className={`text-sm font-medium capitalize ${getPaymentColor(
              sale.payment_method
            )}`}
          >
            {sale.payment_method}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-3 text-sm text-muted-foreground mb-3">
        <User className="h-4 w-4" /> User: {sale.user_id?.slice(0, 8)}
        <Package className="h-4 w-4" /> {normalizeItems(sale.items).length}{" "}
        items
      </div>

      <Separator className="my-3" />

      {/* Actions */}
      {!sale.deleted ? (
        <div className="flex flex-col sm:flex-row gap-2">
          <Button size="sm" variant="outline" onClick={() => onReturn(sale)}>
            <RotateCcw className="mr-2 h-4 w-4" /> Return/Edit
          </Button>

          <Button size="sm" variant="outline" onClick={() => onPrint(sale)}>
            Print Bill
          </Button>

          <Button
            size="sm"
            variant="destructive"
            onClick={() => onDelete(sale.id)}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onRestore(sale.id)}
          >
            <RotateCcw className="mr-2 h-4 w-4" /> Restore
          </Button>

          {isSystemAdmin && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onPermanentDelete(sale.id)}
            >
              <XCircle className="mr-2 h-4 w-4" /> Permanent Delete
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
