"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UserCheck, Trophy, Medal, Search, ArrowUpDown, Award, X, Users } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface SalespersonMetrics {
  id: string;
  name: string;
  totalSales: number;
  orderCount: number;
  avgOrderValue: number;
}

interface SalespersonPerformanceProps {
  data?: SalespersonMetrics[];
}

export function SalespersonPerformance({ data = [] }: SalespersonPerformanceProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterActiveOnly, setFilterActiveOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"sales" | "orders" | "avg">("sales");

  const totalPeriodSales = useMemo(() => {
    return data.reduce((sum, d) => sum + d.totalSales, 0);
  }, [data]);

  const maxSales = useMemo(() => {
    return Math.max(...data.map((d) => d.totalSales), 1);
  }, [data]);

  const activeSalespersonsCount = useMemo(() => {
    return data.filter((d) => d.totalSales > 0 || d.orderCount > 0).length;
  }, [data]);

  // Filter and sort salespersons
  const filteredData = useMemo(() => {
    return data
      .filter((sp) => {
        const matchesSearch = sp.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filterActiveOnly ? sp.totalSales > 0 || sp.orderCount > 0 : true;
        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => {
        if (sortBy === "orders") {
          return b.orderCount - a.orderCount;
        }
        if (sortBy === "avg") {
          return b.avgOrderValue - a.avgOrderValue;
        }
        return b.totalSales - a.totalSales; // default: sales
      });
  }, [data, searchQuery, filterActiveOnly, sortBy]);

  const getRankBadge = (rankIndex: number, hasSales: boolean) => {
    if (!hasSales) return null;
    if (rankIndex === 0) {
      return (
        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-500 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded-full border border-amber-500/20">
          <Trophy className="h-2.5 w-2.5 text-amber-500 fill-amber-500" />
          #1
        </span>
      );
    }
    if (rankIndex === 1) {
      return (
        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-slate-500 dark:text-slate-300 bg-slate-500/10 px-1.5 py-0.2 rounded-full border border-slate-400/20">
          <Medal className="h-2.5 w-2.5 text-slate-400 fill-slate-400" />
          #2
        </span>
      );
    }
    if (rankIndex === 2) {
      return (
        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-600 bg-amber-700/10 px-1.5 py-0.2 rounded-full border border-amber-700/20">
          <Award className="h-2.5 w-2.5 text-amber-700 fill-amber-700" />
          #3
        </span>
      );
    }
    return (
      <span className="text-[9px] font-medium text-muted-foreground bg-muted px-1.5 py-0.2 rounded-full">
        #{rankIndex + 1}
      </span>
    );
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <Card className="col-span-1 shadow-sm border">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="flex items-center text-base gap-1.5 font-semibold truncate">
              <UserCheck className="h-4 w-4 text-primary shrink-0" />
              Sales Person Performance
            </CardTitle>
            <CardDescription className="text-[11px] text-muted-foreground truncate">
              Revenue & order contribution
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-[10px] font-normal px-2 py-0.5 shrink-0">
            <Users className="h-3 w-3 mr-1 text-primary" />
            {data.length}
          </Badge>
        </div>

        {/* Search & Sort Controls */}
        {data.length > 0 && (
          <div className="mt-2 flex items-center gap-1.5">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-7 pr-6 h-7 text-[11px] bg-background/60"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-[10px] gap-1 shrink-0 bg-background/60"
              onClick={() => {
                if (sortBy === "sales") setSortBy("orders");
                else if (sortBy === "orders") setSortBy("avg");
                else setSortBy("sales");
              }}
              title={`Sorting by ${sortBy === "sales" ? "Revenue" : sortBy === "orders" ? "Order Count" : "Avg Order Value"}`}
            >
              <ArrowUpDown className="h-2.5 w-2.5 text-primary" />
              <span className="capitalize">{sortBy === "sales" ? "Revenue" : sortBy === "orders" ? "Orders" : "Avg"}</span>
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-4 pt-1">
        {data.length === 0 ? (
          <div className="text-center py-6 text-xs text-muted-foreground">
            <UserCheck className="h-6 w-6 mx-auto mb-1 opacity-40 text-muted-foreground" />
            No sales recorded for salespersons in this period.
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-4 text-xs text-muted-foreground">
            No salespersons matching "{searchQuery}"
          </div>
        ) : (
          /* Fixed Compact Scroll Area matching left card height (~185px) */
          <div className="max-h-[185px] overflow-y-auto pr-1 space-y-1.5 custom-scrollbar">
            {filteredData.map((sp, idx) => {
              const percent = totalPeriodSales > 0 ? Math.round((sp.totalSales / totalPeriodSales) * 100) : 0;
              const barPercent = Math.round((sp.totalSales / maxSales) * 100);
              const isTop = idx === 0 && sp.totalSales > 0;
              const hasSales = sp.totalSales > 0;

              return (
                <div
                  key={sp.id}
                  className={`p-2 border rounded-lg transition-all ${
                    isTop
                      ? "bg-gradient-to-r from-amber-500/5 via-card to-card border-amber-500/30"
                      : hasSales
                      ? "bg-card border-border/60"
                      : "bg-muted/20 border-border/40 opacity-80"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {/* Compact Avatar */}
                      <div
                        className={`h-7 w-7 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 border ${
                          isTop
                            ? "bg-amber-500/10 text-amber-600 border-amber-500/30 dark:text-amber-400"
                            : "bg-primary/10 text-primary border-primary/20"
                        }`}
                      >
                        {getInitials(sp.name)}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="font-semibold text-xs truncate max-w-[120px]" title={sp.name}>
                            {sp.name}
                          </p>
                          {getRankBadge(idx, hasSales)}
                        </div>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1 leading-none mt-0.5">
                          <span>{sp.orderCount} {sp.orderCount === 1 ? "ord" : "ords"}</span>
                          <span>•</span>
                          <span>Avg ₹{Math.round(sp.avgOrderValue).toLocaleString("en-IN")}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-bold text-xs tabular-nums text-foreground">
                        ₹{sp.totalSales.toLocaleString("en-IN")}
                      </p>
                      <span className="text-[9px] text-muted-foreground block leading-none mt-0.5">
                        {percent}% of sales
                      </span>
                    </div>
                  </div>

                  {/* Sleek Progress Bar (only if sales exist) */}
                  {hasSales && (
                    <div className="mt-1.5">
                      <Progress
                        value={barPercent}
                        className={`h-1 rounded-full ${isTop ? "[&>div]:bg-amber-500" : ""}`}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
