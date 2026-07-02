"use client";
import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FileText, Download, Calendar, Calculator, Loader2 } from "lucide-react";
import DateRangePicker from "./DateRangePicker";

interface ReportControlsProps {
  reportType: string;
  dateRange: string;
  setReportType: (val: string) => void;
  setDateRange: (val: string) => void;
  onExport: () => void;
  customDateRange?: { from?: Date; to?: Date } | null;
  onCustomDateRangeChange?: (range: { from?: Date; to?: Date } | null) => void;
  allTimeRange?: { from?: Date; to?: Date } | null;
  onAuditClick?: () => void;
  isLoading?: boolean;
}

export default function ReportControls({
  reportType,
  dateRange,
  setReportType,
  setDateRange,
  onExport,
  customDateRange,
  onCustomDateRangeChange,
  allTimeRange,
  onAuditClick,
  isLoading,
}: ReportControlsProps) {
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const handleDateRangeChange = (value: string) => {
    if (value === "custom") {
      setDatePickerOpen(true);
    } else {
      setDateRange(value);
      // Clear custom date range when switching to preset
      if (onCustomDateRangeChange) {
        onCustomDateRangeChange(null);
      }
    }
  };

  const handleCustomDateRangeApply = (range: { from?: Date; to?: Date } | null) => {
    if (onCustomDateRangeChange) {
      onCustomDateRangeChange(range);
    }
    if (range) {
      setDateRange("custom");
    }
    setDatePickerOpen(false);
  };

  const getDateRangeDisplay = () => {
    if (dateRange === "custom" && customDateRange) {
      if (customDateRange.from && customDateRange.to) {
        const fromStr = format(customDateRange.from, "MMM dd, yyyy");
        const toStr = format(customDateRange.to, "MMM dd, yyyy");
        if (fromStr === toStr) {
          return fromStr;
        }
        return `${fromStr} - ${toStr}`;
      }
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
        return "Select date range";
    }
  };

  const getAllTimeRangeDisplay = () => {
    if (allTimeRange?.from && allTimeRange?.to) {
      const fromStr = format(allTimeRange.from, "MMM dd, yyyy");
      const toStr = format(allTimeRange.to, "MMM dd, yyyy");
      return `${fromStr} - ${toStr}`;
    }
    return "All time";
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            Report Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 md:items-end ">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Report Type</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily Sales</SelectItem>
                  <SelectItem value="weekly">Weekly Summary</SelectItem>
                  <SelectItem value="monthly">Monthly Report</SelectItem>
                  <SelectItem value="inventory">Inventory Report</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Date Range</label>
              <Select value={dateRange} onValueChange={handleDateRangeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 days</SelectItem>
                  <SelectItem value="month">Last 30 days</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
              {dateRange === "custom" && customDateRange && (
                <div className="mt-2 text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{getDateRangeDisplay()}</span>
                </div>
              )}
              {dateRange === "all" && allTimeRange && (
                <div className="mt-2 text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{getAllTimeRangeDisplay()}</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {onAuditClick && (
                <Button variant="outline" onClick={onAuditClick} disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" />
                  ) : (
                    <Calculator className="mr-2 h-4 w-4" />
                  )}
                  Audit Calculations
                </Button>
              )}
              <Button onClick={onExport} disabled={isLoading}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <DateRangePicker
        open={datePickerOpen}
        onOpenChange={setDatePickerOpen}
        onDateRangeChange={handleCustomDateRangeApply}
        currentRange={customDateRange}
      />
    </>
  );
}
