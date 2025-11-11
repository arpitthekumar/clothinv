"use client";

import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";

interface AnalyticsChartsProps {
  salesData?: any[];
  categoryData?: any[];
  topProducts?: any[];
  profitData?: any[];
}

export default function AnalyticsCharts({
  salesData = [],
  categoryData = [],
  topProducts = [],
  profitData = [],
}: AnalyticsChartsProps) {
  // ✅ Indian numbering formatter (no decimals)
  const formatIN = (num: number) =>
    num.toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

  // ✅ Currency tooltip formatter
  const currencyFormatter = (value: number) => `₹${formatIN(value)}`;

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
      {/* 📈 Sales Trend */}
      <div className="bg-card p-4 rounded-lg shadow">
        <h3 className="font-semibold mb-2 text-center">Sales Trend</h3>
        {salesData.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">
            No data available
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis
                tickFormatter={(value: unknown) =>
                  formatIN(Number(value))
                }
                width={80}
              />
              <Tooltip
                formatter={(value: unknown) =>
                  currencyFormatter(Number(value))
                }
              />
              <Line
                type="monotone"
                dataKey="sales"
                stroke="#8884d8"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* 🥧 Category Sales */}
      <div className="bg-card p-4 rounded-lg shadow">
        <h3 className="font-semibold mb-2 text-center">Category Sales</h3>
        {categoryData.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">
            No data available
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={categoryData}
                dataKey="value"
                nameKey="name"
                outerRadius={80}
                fill="#8884d8"
                label={(entry: any) =>
                  `${entry.name} (${formatIN(Number(entry.value))})`
                }
              >
                {categoryData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: unknown) =>
                  currencyFormatter(Number(value))
                }
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* 🏆 Top Products */}
      <div className="bg-card p-4 rounded-lg shadow md:col-span-2 xl:col-span-1">
        <h3 className="font-semibold mb-2 text-center">Top Products</h3>
        {topProducts.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">
            No data available
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={topProducts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis
                tickFormatter={(value: unknown) =>
                  formatIN(Number(value))
                }
                width={80}
              />
              <Tooltip
                formatter={(value: unknown) =>
                  currencyFormatter(Number(value))
                }
              />
              <Legend />
              <Bar dataKey="sales" fill="#82ca9d" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
