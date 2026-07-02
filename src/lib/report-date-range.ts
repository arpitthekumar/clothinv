import { format } from "date-fns";

/** Label for the selected report period (matches ReportControls / KPI copy). */
export function getReportDateRangeLabel(
  dateRange: string,
  customDateRange?: { from?: Date; to?: Date } | null,
  allTimeRange?: { from?: Date; to?: Date } | null
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
      if (allTimeRange?.from && allTimeRange?.to) {
        const fromStr = format(allTimeRange.from, "MMM dd, yyyy");
        const toStr = format(allTimeRange.to, "MMM dd, yyyy");
        return `All time (${fromStr} - ${toStr})`;
      }
      return "All time";
    default:
      return "Selected period";
  }
}
