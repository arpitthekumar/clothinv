"use client";

import { useState } from "react";
import { format } from "date-fns";
import CustomCalendar from "@/components/ui/CustomCalendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface DateRange {
  from?: Date;
  to?: Date;
}

interface DateRangePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDateRangeChange: (range: DateRange | null) => void;
  currentRange?: DateRange | null;
}

export default function DateRangePicker({
  open,
  onOpenChange,
  onDateRangeChange,
  currentRange,
}: DateRangePickerProps) {
  const [mode, setMode] = useState<"single" | "range">("range");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    currentRange?.from
  );
  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    currentRange?.from || currentRange?.to
      ? { from: currentRange.from, to: currentRange.to }
      : undefined
  );

  const handleApply = () => {
    if (mode === "single" && selectedDate) {
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);
      onDateRangeChange({ from: startOfDay, to: endOfDay });
      onOpenChange(false);
    } else if (mode === "range" && dateRange?.from) {
      const from = dateRange.from;
      const to = dateRange.to || dateRange.from;
      const startOfDay = new Date(from);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(to);
      endOfDay.setHours(23, 59, 59, 999);
      onDateRangeChange({ from: startOfDay, to: endOfDay });
      onOpenChange(false);
    }
  };

  const handleClear = () => {
    setSelectedDate(undefined);
    setDateRange(undefined);
    onDateRangeChange(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-w-[95vw] p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-xl font-semibold">
            Select Date Range
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Choose a single date or a date range for your report
          </DialogDescription>
        </DialogHeader>

        {/* Body */}
        <div className="px-6 py-4 space-y-6">
          {/* Selection Mode */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Selection Mode</Label>
            <RadioGroup
              value={mode}
              onValueChange={(value) => setMode(value as "single" | "range")}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="single" id="single" />
                <Label
                  htmlFor="single"
                  className="cursor-pointer text-lg font-normal"
                >
                  Single Date
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="range" id="range" />
                <Label
                  htmlFor="range"
                  className="cursor-pointer text-lg font-normal"
                >
                  Date Range
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Calendar */}
          <div className="flex justify-center items-start bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 sm:p-6 border border-border">
            <div className="bg-card rounded-lg shadow-md border border-border p-3 sm:p-4 w-full max-w-md mx-auto">
              <CustomCalendar
                mode={mode}
                selected={mode === "single" ? selectedDate : dateRange}
                onSelect={(value: any) => {
                  if (mode === "single") setSelectedDate(value);
                  else setDateRange(value);
                }}
              />
            </div>
          </div>

          {/* Summary */}
          {(mode === "single" && selectedDate) ||
          (mode === "range" && dateRange?.from) ? (
            <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-lg p-4 space-y-2">
              {mode === "single" && selectedDate && (
                <div className="flex items-center gap-3">
                  <div className="h-2.5 w-2.5 rounded-full bg-primary shadow-sm"></div>
                  <span className="text-sm font-medium text-foreground">
                    Selected:{" "}
                    <span className="text-primary font-semibold">
                      {format(selectedDate, "EEEE, MMMM dd, yyyy")}
                    </span>
                  </span>
                </div>
              )}

              {mode === "range" && dateRange && (
                <>
                  {dateRange.from && (
                    <div className="flex items-center gap-3">
                      <div className="h-2.5 w-2.5 rounded-full bg-primary shadow-sm"></div>
                      <span className="text-sm font-medium text-foreground">
                        From:{" "}
                        <span className="text-primary font-semibold">
                          {format(dateRange.from, "EEEE, MMMM dd, yyyy")}
                        </span>
                      </span>
                    </div>
                  )}
                  {dateRange.to &&
                    dateRange.to.getTime() !== dateRange.from?.getTime() && (
                      <div className="flex items-center gap-3">
                        <div className="h-2.5 w-2.5 rounded-full bg-primary shadow-sm"></div>
                        <span className="text-sm font-medium text-foreground">
                          To:{" "}
                          <span className="text-primary font-semibold">
                            {format(dateRange.to, "EEEE, MMMM dd, yyyy")}
                          </span>
                        </span>
                      </div>
                    )}
                  {dateRange.from && !dateRange.to && (
                    <div className="flex items-center gap-3 text-primary/80">
                      <div className="h-2.5 w-2.5 rounded-full bg-primary/60 animate-pulse"></div>
                      <span className="text-sm font-medium italic">
                        Click to select end date (or apply for single date)
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 flex  border-t  text-center bg-muted/30">
          <Button
            variant="outline"
            onClick={handleClear}
            className="min-w-[100px]"
          >
            Clear
          </Button>
          <Button
            onClick={handleApply}
            disabled={
              (mode === "single" && !selectedDate) ||
              (mode === "range" && !dateRange?.from)
            }
            className="min-w-[100px]"
          >
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
