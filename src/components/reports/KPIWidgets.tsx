import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";

interface KPIWidgetsProps {
  profit: number;
  valuation: number;
  totalCost: number;
  notSellingCount: number;
}

export default function KPIWidgets({ profit, valuation, totalCost, notSellingCount }: KPIWidgetsProps) {
  console.log("🧾 Stock Valuation Data:", valuation, totalCost);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Profit (30 days)</CardTitle>
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
          <CardTitle>Not Selling (30 days)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{notSellingCount}</p>
        </CardContent>
      </Card>
    </div>
  );
}
