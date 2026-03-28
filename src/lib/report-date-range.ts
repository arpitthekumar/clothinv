import { format } from "date-fns";

/** Label for the selected report period (matches ReportControls / KPI copy). */
export function getReportDateRangeLabel(
  dateRange: string,
  customDateRange?: { from?: Date; to?: Date } | null
): string {
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
}
