import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";

interface KPIWidgetsProps {
  profit: number;
  valuation: number;
  notSellingCount: number;
}

export default function KPIWidgets({ profit, valuation, notSellingCount }: KPIWidgetsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
          <p className="text-2xl font-bold">₹{Math.round(valuation).toLocaleString()}</p>
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
