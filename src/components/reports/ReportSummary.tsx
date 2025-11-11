"use client";

import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, FileText, Calendar } from "lucide-react";

interface ReportSummaryProps {
  totalSales: number;
  totalTransactions: number;
  averageTicket: number;
}

export default function ReportSummary({
  totalSales,
  totalTransactions,
  averageTicket,
}: ReportSummaryProps) {
  // ✅ Format numbers in Indian style (no decimals)
  const formatIN = (num: number) =>
    num.toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* 💰 Total Sales */}
      <Card>
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Total Sales
            </p>
            <p className="text-2xl font-bold text-green-600">
              ₹{formatIN(totalSales)}
            </p>
          </div>
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <TrendingUp className="text-green-600" />
          </div>
        </CardContent>
      </Card>

      {/* 🧾 Transactions */}
      <Card>
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Transactions
            </p>
            <p className="text-2xl font-bold text-blue-600">
              {formatIN(totalTransactions)}
            </p>
          </div>
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <FileText className="text-blue-600" />
          </div>
        </CardContent>
      </Card>

      {/* 📅 Average Ticket */}
      <Card>
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Average Ticket
            </p>
            <p className="text-2xl font-bold text-purple-600">
              ₹{formatIN(averageTicket)}
            </p>
          </div>
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <Calendar className="text-purple-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
