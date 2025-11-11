import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

interface KPIWidgetsProps {
  profit: number;
  valuation: number;
  totalCost: number;
  notSellingCount: number;
  dateRange: string;
  customDateRange?: { from?: Date; to?: Date } | null;
}

export default function KPIWidgets({
  profit,
  valuation,
  totalCost,
  notSellingCount,
  dateRange,
  customDateRange,
}: KPIWidgetsProps) {
  // console.log("🧾 Stock Valuation Data:", valuation, totalCost);

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
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Profit ({dateRangeLabel})</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">₹{Math.round(profit).toLocaleString()}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stock Valuation</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-green-600">
            ₹{Math.round(valuation).toLocaleString()}
          </p>
          <p className="text-sm text-gray-500">Based on selling prices</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Total Cost</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-blue-600">
            ₹{Math.round(totalCost).toLocaleString()}
          </p>
          <p className="text-sm text-gray-500">Based on buying prices</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Not Selling ({dateRangeLabel})</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{notSellingCount}</p>
        </CardContent>
      </Card>
    </div>
  );
}
