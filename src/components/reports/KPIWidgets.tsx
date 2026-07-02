"use client";

import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { getReportDateRangeLabel } from "@/lib/report-date-range";

interface KPIWidgetsProps {
  profit: number;
  valuation: number;
  totalCost: number;
  totalSalesCost: number;
  notSellingCount: number;
  dateRange: string;
  customDateRange?: { from?: Date; to?: Date } | null;
  allTimeRange?: { from?: Date; to?: Date } | null;
}

export default function KPIWidgets({
  profit,
  valuation,
  totalCost,
  totalSalesCost,
  notSellingCount,
  dateRange,
  customDateRange,
  allTimeRange,
}: KPIWidgetsProps) {
  // ✅ Format numbers using Indian comma style (no decimals)
  const formatIN = (num: number) =>
    num.toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

  const dateRangeLabel = getReportDateRangeLabel(dateRange, customDateRange, allTimeRange);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
      {/* 💰 Profit */}
      <Card>
        <CardHeader>
          <CardTitle>Profit ({dateRangeLabel})</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-green-600">
            ₹{formatIN(profit)}
          </p>
          <p className="text-sm text-gray-500">Calculated after costs</p>
        </CardContent>
      </Card>

      {/* 💸 Cost of Sales */}
      <Card>
        <CardHeader>
          <CardTitle>Cost of Sales ({dateRangeLabel})</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-purple-600">
            ₹{formatIN(totalSalesCost)}
          </p>
          <p className="text-sm text-gray-500">Cost of goods sold (COGS)</p>
        </CardContent>
      </Card>

      {/* 📦 Stock Valuation */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Valuation</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-blue-600">
            ₹{formatIN(valuation)}
          </p>
          <p className="text-sm text-gray-500">Based on selling prices</p>
        </CardContent>
      </Card>

      {/* 💵 Total Cost */}
      <Card>
        <CardHeader>
          <CardTitle>Total Cost</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-orange-600">
            ₹{formatIN(totalCost)}
          </p>
          <p className="text-sm text-gray-500">Based on buying prices</p>
        </CardContent>
      </Card>

      {/* 💤 Not Selling */}
      <Card>
        <CardHeader>
          <CardTitle>Not Selling ({dateRangeLabel})</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-red-600">
            {formatIN(notSellingCount)}
          </p>
          <p className="text-sm text-gray-500">Items with no sales</p>
        </CardContent>
      </Card>
    </div>
  );
}
