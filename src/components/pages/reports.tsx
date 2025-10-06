"use client";

import { useState } from "react";
import { Sale } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/shared/sidebar";
import { Header } from "@/components/shared/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, FileText, Calendar, TrendingUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function Reports() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [reportType, setReportType] = useState("daily");
  const [dateRange, setDateRange] = useState("today");

  const { data: sales = [], isLoading: salesLoading } = useQuery<Sale[]>({
    queryKey: ["/api/sales"],
  });

  // New report data
  const { data: valuation } = useQuery<any>({
    queryKey: ["/api/reports/stock-valuation"],
  });
  const { data: profit } = useQuery<any>({
    queryKey: ["/api/reports/profit-margins", { sinceDays: 30 }],
  });
  const { data: notSelling } = useQuery<any[]>({
    queryKey: ["/api/reports/not-selling", { sinceDays: 30 }],
  });


  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleExportReport = () => {
    // This would generate and download a report file
    const reportData = sales || [];
    const csvContent = generateCSVReport(reportData);
    downloadFile(csvContent, `sales-report-${Date.now()}.csv`, "text/csv");
  };

  const generateCSVReport = (data: Sale[]) => {
    const headers = ["Invoice Number", "Date", "Total Amount", "Items", "Payment Method"];
    const rows = data.map((sale: Sale) => {
      const createdAt = sale.createdAt ? new Date((sale as any).createdAt as string | number | Date) : null;
      const itemsValue: unknown = (sale as any).items;
      const items = typeof itemsValue === "string" ? JSON.parse(itemsValue as string) : (itemsValue || []);
      return [
        sale.invoiceNumber,
        createdAt ? createdAt.toLocaleDateString() : "",
        sale.totalAmount,
        Array.isArray(items) ? items.length : 0,
        sale.paymentMethod
      ];
    });
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(","))
      .join("\n");
    
    return csvContent;
  };

  const downloadFile = (content: string, filename: string, _type: string) => {
    const blob = new Blob([content], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filteredSales = sales?.filter((sale: any) => {
    const createdAt = sale?.createdAt ? new Date(sale.createdAt as string | number | Date) : null;
    if (!createdAt) return false;
    const saleDate = createdAt;
    const today = new Date();
    
    switch (dateRange) {
      case "today":
        return saleDate.toDateString() === today.toDateString();
      case "week":
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        return saleDate >= weekAgo;
      case "month":
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        return saleDate >= monthAgo;
      default:
        return true;
    }
  }) || [];

  const totalSales = filteredSales.reduce((sum: number, sale: any) => sum + parseFloat(sale.totalAmount), 0);
  const totalTransactions = filteredSales.length;
  const averageTicket = totalTransactions > 0 ? totalSales / totalTransactions : 0;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar isOpen={sidebarOpen}  />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="Reports & Analytics"
          subtitle="View sales performance and generate reports"
          onSidebarToggle={toggleSidebar}
        />

        <main className="flex-1 overflow-auto p-6 space-y-6">
          {/* Report Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Report Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Report Type</label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger data-testid="select-report-type">
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
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger data-testid="select-date-range">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">Last 7 days</SelectItem>
                      <SelectItem value="month">Last 30 days</SelectItem>
                      <SelectItem value="all">All time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleExportReport} data-testid="button-export-report">
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Report Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Sales</p>
                    <p className="text-2xl font-bold" data-testid="text-total-sales">
                      ₹{totalSales.toLocaleString()}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Transactions</p>
                    <p className="text-2xl font-bold" data-testid="text-total-transactions">
                      {totalTransactions}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Average Ticket</p>
                    <p className="text-2xl font-bold" data-testid="text-average-ticket">
                      ₹{averageTicket.toFixed(2)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Calendar className="text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* New KPI Widgets: Profit, Stock Valuation, Not Selling */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Profit (30 days)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">₹{Number(profit?.totalProfit || 0).toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Stock Valuation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">₹{Number(valuation?.totalValuation || 0).toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Not Selling (30 days)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{Array.isArray(notSelling) ? notSelling.length : 0}</p>
              </CardContent>
            </Card>
          </div>

          {/* Not Selling Preview Table */}
          <Card>
            <CardHeader>
              <CardTitle>Products Not Selling (Top 10)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Last Sold</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.isArray(notSelling) && notSelling.length > 0 ? (
                      notSelling.slice(0, 10).map((p: any) => (
                        <TableRow key={p.productId || p.product_id}>
                          <TableCell>{p.name}</TableCell>
                          <TableCell>{p.sku}</TableCell>
                          <TableCell>{p.stock}</TableCell>
                          <TableCell>{p.lastSoldAt || p.last_sold_at || 'Never'}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No items to show</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Sales Table */}
          <Card>
            <CardHeader>
              <CardTitle>Sales Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {salesLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice</TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSales.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            <p className="text-muted-foreground">No sales data available for the selected period</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredSales.map((sale: any) => {
                          const items = typeof sale.items === "string" ? JSON.parse(sale.items) : (sale.items || []);
                          const itemCount = items.reduce((sum: number, item: any) => sum + item.quantity, 0);
                          
                          return (
                            <TableRow key={sale.id} data-testid={`sale-row-${sale.id}`}>
                              <TableCell className="font-medium">
                                {sale.invoiceNumber?.split('-')[2] || 'Unknown'}
                              </TableCell>
                              <TableCell>
                                <div>
                                  {sale.createdAt ? (
                                    <>
                                      <p className="text-sm font-medium">
                                        {new Date(sale.createdAt as string | number | Date).toLocaleDateString()}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date(sale.createdAt as string | number | Date), { addSuffix: true })}
                                      </p>
                                    </>
                                  ) : (
                                    <p className="text-sm text-muted-foreground">—</p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>{itemCount} items</TableCell>
                              <TableCell className="font-medium">
                                ₹{parseFloat(sale.totalAmount).toLocaleString()}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="capitalize">
                                  {sale.paymentMethod}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="default" className="bg-green-100 text-green-800">
                                  Completed
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
