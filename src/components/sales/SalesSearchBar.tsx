"use client";

import { Search, Trash2, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

export default function SalesSearchBar({
  searchTerm,
  setSearchTerm,
  showTrash,
  setShowTrash,
  limit,
  searchBy,
  setSearchBy,
  setLimit,
  payment,
  setPayment,
  productId,
  setProductId,
  dateRange,
  setDateRange,
  onOpenDatePicker,
  refresh,
}: any) {
  // 🔥 When user selects preset
  function handleRange(value: string) {
    setDateRange(value);

    // If custom → open date picker, do NOT refresh immediately
    if (value === "custom") {
      onOpenDatePicker();
      return;
    }
    if (value === "all") {
      refresh(true);
      return;
    }

    refresh(true); // Reset pages + reload
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Search Sales</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search + Trash Toggle */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 w-full">

          {/* LEFT SIDE — Filters + Search */}
          <div className="flex flex-col md:flex-row flex-1 gap-3 w-full">

            {/* Search By Select */}
            <Select value={searchBy} onValueChange={(v) => setSearchBy(v)}>
              <SelectTrigger className="w-full md:w-36">
                <SelectValue placeholder="Search By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="invoice">Invoice No.</SelectItem>
                <SelectItem value="name">C-Name</SelectItem>
                <SelectItem value="phone">Phone</SelectItem>
                <SelectItem value="payment">P-Method</SelectItem>
                <SelectItem value="amount">Amount</SelectItem>
              </SelectContent>
            </Select>

            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder={`Search by ${searchBy}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && refresh(true)}
                className="pl-10 w-full"
              />
            </div>

            {/* Search + Clear Buttons */}
            <div className="flex w-full md:w-auto gap-3">
              <Button className="flex-1 md:flex-none" onClick={() => refresh(true)}>
                Search
              </Button>

              <Button
                variant="outline"
                className="flex-1 md:flex-none"
                onClick={() => {
                  setSearchTerm("");
                  refresh(true);
                }}
              >
                Clear
              </Button>
            </div>
          </div>

          {/* RIGHT — Trash Toggle */}
          <Button
            variant={showTrash ? "destructive" : "outline"}
            onClick={() => {
              setShowTrash(!showTrash);
              refresh(true);
            }}
            className="whitespace-nowrap"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {showTrash ? "Active Sales" : "Trash"}
          </Button>
        </div>


        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {/* Limit */}
          <div>
            <label className="text-sm font-medium mb-2 block">Limit</label>

            <Select
              value={String(limit)}
              onValueChange={(value) => {
                setLimit(Number(value));
                refresh(true);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Limit" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="15">15</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>


          {/* Payment */}
          <div>
            <label className="text-sm font-medium mb-2 block">Payment</label>

            <Select
              value={payment === "" ? "all" : payment}
              onValueChange={(value) => {
                setPayment(value === "all" ? "" : value); // convert back to empty string
                refresh(true);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="credit">Credit</SelectItem>
                <SelectItem value="bank">Bank</SelectItem>
              </SelectContent>
            </Select>
          </div>


          {/* Product Filter
          <div>
            <label className="text-sm font-medium mb-2 block">Product ID</label>
            <Input
              placeholder="product id"
              value={productId}
              onChange={(e) => {
                setProductId(e.target.value);
                refresh(true);
              }}
            />
          </div> */}

          {/* Date Filter Select */}
          <div className="col-span-2">
            <label className="text-sm font-medium mb-2 block">
              Date Filter
            </label>
            <Select value={dateRange} onValueChange={handleRange}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Date" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="custom">Custom Range…</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}