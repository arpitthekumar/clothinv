import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Package, AlertTriangle, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function StatsGrid() {
  const { data: stats, isLoading } = useQuery<{
    todaySales: number;
    totalProducts: number;
    lowStockItems: number;
    activeEmployees: number;
  }>({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-12 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // ✅ Default values to prevent "possibly undefined" errors
  const {
    todaySales = 0,
    totalProducts = 0,
    lowStockItems = 0,
    activeEmployees = 0,
  } = stats || {};

  const statItems = [
    {
      title: "Today's Sales",
      value: `₹${Math.round(todaySales).toLocaleString()}`,
      change: "+12% from yesterday",
      icon: TrendingUp,
      bgColor: "bg-green-100",
      iconColor: "text-green-600",
      changeColor: "text-green-600",
    },
    {
      title: "Total Products",
      value: totalProducts.toLocaleString(),
      change: "+23 new this week",
      icon: Package,
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600",
      changeColor: "text-blue-600",
    },
    {
      title: "Low Stock Items",
      value: lowStockItems,
      change: "Needs attention",
      icon: AlertTriangle,
      bgColor: "bg-amber-100",
      iconColor: "text-amber-600",
      changeColor: "text-amber-600",
    },
    {
      title: "Active Employees",
      value: activeEmployees,
      change:
        activeEmployees === 0
          ? "No employees found"
          : activeEmployees === 1
          ? "1 employee active"
          : `${activeEmployees} employees active`,
      icon: Users,
      bgColor: activeEmployees > 0 ? "bg-green-100" : "bg-red-100",
      iconColor: activeEmployees > 0 ? "text-green-600" : "text-red-600",
      changeColor: activeEmployees > 0 ? "text-green-600" : "text-red-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
      {statItems.map((stat, index) => (
        <Card
          key={index}
          data-testid={`stat-${stat.title.toLowerCase().replace(/\s+/g, "-")}`}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </p>
                <p
                  className="text-2xl font-bold"
                  data-testid={`value-${stat.title
                    .toLowerCase()
                    .replace(/\s+/g, "-")}`}
                >
                  {stat.value}
                </p>
                <p className={`text-xs mt-1 ${stat.changeColor}`}>
                  {stat.change}
                </p>
              </div>
              <div
                className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}
              >
                <stat.icon className={`${stat.iconColor}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
