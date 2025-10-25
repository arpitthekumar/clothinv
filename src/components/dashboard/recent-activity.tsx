import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { normalizeItems } from "@/lib/json";

export function RecentActivity() {
  const { data: sales, isLoading } = useQuery<Array<{
    id: string;
    items: string;
     total_amount: string;
     invoice_number: string;
     created_at: string;
  }>>({
    queryKey: ["/api/sales/today"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="mr-2 text-primary" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <Skeleton className="w-2 h-2 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const recentSales = sales?.slice(0, 5) || [];

  const getActivityColor = (index: number) => {
    const colors = ["bg-green-500", "bg-blue-500", "bg-amber-500", "bg-purple-500", "bg-red-500"];
    return colors[index % colors.length];
  };

  return (
    <Card data-testid="card-recent-activity">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="mr-2 text-primary" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {recentSales.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">No recent activity</p>
          </div>
        ) : (
          recentSales.map((sale: any, index: number) => {
            const items = normalizeItems(sale.items);
            const itemCount = Array.isArray(items) ? items.reduce((sum, item) => sum + (item?.quantity || 0), 0) : 0;

            return (
              <div key={sale.id} className="flex items-center space-x-3" data-testid={`activity-${index}`}>
                <div className={`w-2 h-2 ${getActivityColor(index)} rounded-full`} />
                <div className="flex-1">
                  <p className="text-sm font-medium" data-testid={`activity-title-${index}`}>
                     Sale #{sale.invoice_number?.split('-')[2] || 'Unknown'}
                  </p>
                  <p className="text-xs text-muted-foreground" data-testid={`activity-details-${index}`}>
                     ₹{sale.total_amount} - {itemCount} items
                  </p>
                </div>
                <span className="text-xs text-muted-foreground" data-testid={`activity-time-${index}`}>
                  {sale.created_at ? formatDistanceToNow(new Date(sale.created_at), { addSuffix: true }) : 'Unknown'}
                </span>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
