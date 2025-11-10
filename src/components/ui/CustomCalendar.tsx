"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CustomCalendarProps {
  mode?: "single" | "range";
  selected?: Date | { from?: Date; to?: Date };
  onSelect?: (value: any) => void;
  className?: string;
}

export default function CustomCalendar({
  mode = "range",
  selected,
  onSelect,
  className,
}: CustomCalendarProps) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [range, setRange] = useState<{ from?: Date; to?: Date }>(
    (selected as any) || {}
  );
  const [single, setSingle] = useState<Date | undefined>(
    selected instanceof Date ? selected : undefined
  );

  const months = [
    "January", "February", "March", "April",
    "May", "June", "July", "August",
    "September", "October", "November", "December",
  ];
  const years = Array.from({ length: 100 }, (_, i) => today.getFullYear() - 50 + i);

  const getDaysInMonth = (month: number, year: number) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const days = getDaysInMonth(currentMonth, currentYear);

  const isDisabled = (date: Date) => date > today;

  const handleDateClick = (date: Date) => {
    if (isDisabled(date)) return;

    if (mode === "single") {
      setSingle(date);
      onSelect?.(date);
      return;
    }

    // RANGE MODE BEHAVIOR
    if (!range.from) {
      // first click: set "from"
      setRange({ from: date, to: undefined });
      return;
    }

    if (range.from && !range.to) {
      // second click: set "to"
      const from = range.from;
      const to = date < from ? from : date;
      setRange({ from: from < date ? from : date, to: from < date ? date : from });
      onSelect?.({ from: from < date ? from : date, to: from < date ? date : from });
      return;
    }

    if (range.from && range.to) {
      // third click → start new range
      setRange({ from: date, to: undefined });
      onSelect?.({ from: date, to: undefined });
    }
  };

  const inRange = (date: Date) => {
    if (mode === "range" && range.from && range.to) {
      return date >= range.from && date <= range.to;
    }
    return false;
  };

  return (
    <div
      className={cn(
        "w-full max-w-md p-4 rounded-xl border border-border bg-card shadow-sm select-none",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            if (currentMonth === 0) {
              setCurrentMonth(11);
              setCurrentYear((y) => y - 1);
            } else setCurrentMonth((m) => m - 1);
          }}
          className="h-8 w-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex gap-2 items-center">
          <select
            value={currentMonth}
            onChange={(e) => setCurrentMonth(Number(e.target.value))}
            className="bg-transparent border border-border rounded-md px-2 py-1 text-sm font-medium text-foreground hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
          >
            {months.map((m, i) => (
              <option key={m} value={i} className="bg-background text-foreground">
                {m}
              </option>
            ))}
          </select>

          <select
            value={currentYear}
            onChange={(e) => setCurrentYear(Number(e.target.value))}
            className="bg-transparent border border-border rounded-md px-2 py-1 text-sm font-medium text-foreground hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer max-h-[150px] overflow-y-auto"
          >
            {years.map((y) => (
              <option key={y} value={y} className="bg-background text-foreground">
                {y}
              </option>
            ))}
          </select>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            if (currentMonth === 11) {
              setCurrentMonth(0);
              setCurrentYear((y) => y + 1);
            } else setCurrentMonth((m) => m + 1);
          }}
          className="h-8 w-8"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Weekdays */}
      <div className="grid grid-cols-7 text-xs font-semibold text-muted-foreground mb-2 text-center">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {days.map((d, i) =>
          d ? (
            <button
              key={i}
              onClick={() => handleDateClick(d)}
              disabled={isDisabled(d)}
              className={cn(
                "h-10 w-10 flex items-center justify-center rounded-full transition-all duration-150 ease-out font-medium text-sm",
                isDisabled(d)
                  ? "text-muted-foreground opacity-50 cursor-not-allowed"
                  : "cursor-pointer hover:bg-accent hover:text-accent-foreground active:scale-95",
                d.toDateString() === today.toDateString()
                  ? "ring-2 ring-primary ring-offset-1"
                  : "",
                mode === "single" && single?.toDateString() === d.toDateString()
                  ? "bg-primary text-primary-foreground font-semibold shadow-md"
                  : "",
                inRange(d)
                  ? "bg-gradient-to-r from-primary/30 to-primary/20 text-primary font-semibold"
                  : "",
                mode === "range" &&
                  range.from?.toDateString() === d.toDateString()
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "",
                mode === "range" &&
                  range.to?.toDateString() === d.toDateString()
                  ? "bg-primary text-primary-foreground font-semibold"
                  : ""
              )}
            >
              {d.getDate()}
            </button>
          ) : (
            <div key={i} className="h-10 w-10" />
          )
        )}
      </div>
    </div>
  );
}
