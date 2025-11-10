import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

interface NotSellingProduct {
  productId: string;
  name: string;
  sku: string;
  stock: number;
  lastSoldAt: string | null;
}

interface NotSellingTableProps {
  products: NotSellingProduct[];
  dateRange: string;
  customDateRange?: { from?: Date; to?: Date } | null;
}

export default function NotSellingTable({
  products,
  dateRange,
  customDateRange,
}: NotSellingTableProps) {
  const getDateRangeLabel = () => {
    if (dateRange === "custom" && customDateRange?.from && customDateRange?.to) {
      const fromStr = format(customDateRange.from, "MMM dd");
      const toStr = format(customDateRange.to, "MMM dd, yyyy");
      if (fromStr === toStr) {
        return format(customDateRange.from, "MMM dd, yyyy");
      }
      return `${fromStr} - ${toStr}`;
    }
    switch (dateRange) {
      case "today":
        return "Today";
      case "week":
        return "Last 7 days";
      case "month":
        return "Last 30 days";
      case "all":
        return "All time";
      default:
        return "Selected period";
    }
  };

  const dateRangeLabel = getDateRangeLabel();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Products Not Selling - {dateRangeLabel} (Top 10)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Last Sold</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.slice(0, 10).map((p) => (
                <TableRow key={p.productId}>
                  <TableCell>{p.name}</TableCell>
                  <TableCell>{p.sku}</TableCell>
                  <TableCell>{p.stock}</TableCell>
                  <TableCell>
                    {p.lastSoldAt
                      ? new Date(p.lastSoldAt.replace(" ", "T")).toLocaleString(
                          "en-IN",
                          {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          }
                        )
                      : "Never"}
                  </TableCell>
                </TableRow>
              ))}
              {products.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-6 text-muted-foreground"
                  >
                    No items to show
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
