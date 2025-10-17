"use client";

import { useState } from "react";
import { Sidebar } from "@/components/shared/sidebar";
import { Header } from "@/components/shared/header";
import RequireAuth from "../_components/require-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Search, 
  Trash2, 
  RotateCcw, 
  Eye, 
  Edit,
  Calendar,
  User,
  CreditCard,
  Package
} from "lucide-react";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { invoicePrinter, type InvoiceData } from "@/lib/printer";
import { normalizeItems } from "@/lib/json";

export default function SalesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showTrash, setShowTrash] = useState(false);
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnItems, setReturnItems] = useState<Array<{productId: string; quantity: number; maxQuantity: number; name: string; price: string}>>([]);
  
  const { toast } = useToast();
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const handlePrintSale = async (sale: any) => {
    try {
      const items = normalizeItems(sale.items);
      const invoice: InvoiceData = {
        invoiceNumber: sale.invoiceNumber || `INV-${sale.id?.slice(0,6)}`,
        date: new Date(sale.createdAt || Date.now()),
        items: items.map((it: any) => ({
          name: it.name,
          quantity: it.quantity,
          price: parseFloat(it.price),
          total: parseFloat(it.price) * it.quantity,
        })),
        subtotal: items.reduce((s: number, it: any) => s + parseFloat(it.price) * it.quantity, 0),
        tax: 0, // unknown here; if you want 18% GST, compute like in POS
        total: parseFloat(sale.totalAmount),
        paymentMethod: sale.paymentMethod,
      };
      await invoicePrinter.printInvoice(invoice);
      toast({ title: "Printing", description: `Invoice ${invoice.invoiceNumber} sent to printer` });
    } catch (e: any) {
      toast({ title: "Print failed", description: e?.message || "Unable to print invoice", variant: "destructive" });
    }
  };

  const { data: sales = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/sales", { includeDeleted: true }],
    queryFn: async () => {
      const response = await fetch("/api/sales?includeDeleted=true", {
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) return [];
      return response.json();
    },
  });

  const deleteSaleMutation = useMutation({
    mutationFn: async (saleId: string) => {
      const res = await apiRequest("DELETE", `/api/sales/${saleId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      toast({
        title: "Sale Deleted",
        description: "Sale has been moved to trash",
      });
    },
  });

  const restoreSaleMutation = useMutation({
    mutationFn: async (saleId: string) => {
      const res = await apiRequest("POST", `/api/sales/${saleId}/restore`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      toast({
        title: "Sale Restored",
        description: "Sale has been restored from trash",
      });
    },
  });

  const returnSaleMutation = useMutation({
    mutationFn: async (returnData: any) => {
      const res = await apiRequest("POST", "/api/sales/returns", returnData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setShowReturnModal(false);
      setReturnItems([]);
      setSelectedSale(null);
      toast({
        title: "Return Processed",
        description: "Items have been returned and inventory updated",
      });
    },
  });

  const filteredSales = sales.filter(sale => {
    const matchesSearch = sale.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sale.totalAmount.toString().includes(searchTerm) ||
                         sale.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTrashFilter = showTrash ? sale.deleted : !sale.deleted;
    return matchesSearch && matchesTrashFilter;
  });

  const handleDeleteSale = (saleId: string) => {
    if (confirm("Are you sure you want to delete this sale? It will be moved to trash.")) {
      deleteSaleMutation.mutate(saleId);
    }
  };

  const handleRestoreSale = (saleId: string) => {
    if (confirm("Are you sure you want to restore this sale? It will be moved back to active sales.")) {
      restoreSaleMutation.mutate(saleId);
    }
  };

  const handleReturnSale = (sale: any) => {
    setSelectedSale(sale);
    const items = normalizeItems(sale.items);
    const returnItemsData = (Array.isArray(items) ? items : []).map((item: any) => ({
      productId: item.productId,
      quantity: 0,
      maxQuantity: item.quantity,
      name: item.name,
      price: item.price
    }));
    setReturnItems(returnItemsData);
    setShowReturnModal(true);
  };

  const updateReturnQuantity = (productId: string, quantity: number) => {
    setReturnItems(prev => prev.map(item => 
      item.productId === productId 
        ? { ...item, quantity: Math.min(Math.max(0, quantity), item.maxQuantity) }
        : item
    ));
  };

  const processReturn = () => {
    const itemsToReturn = returnItems.filter(item => item.quantity > 0);
    if (itemsToReturn.length === 0) {
      toast({
        title: "No Items Selected",
        description: "Please select items to return",
        variant: "destructive",
      });
      return;
    }

    const returnData = {
      saleId: selectedSale.id,
      items: itemsToReturn.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        refundAmount: (parseFloat(item.price) * item.quantity).toFixed(2)
      }))
    };

    returnSaleMutation.mutate(returnData);
  };

  return (
    <RequireAuth>
      <div className="flex h-dvh md:h-screen overflow-hidden bg-background">
        <Sidebar isOpen={sidebarOpen} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header
            title="Sales Management"
            subtitle="View, manage, and process returns for sales"
            onSidebarToggle={toggleSidebar}
          />
          <main className="flex-1 overflow-auto p-4 md:p-6">
            <div className="space-y-6">
              {/* Search and Filters */}
              <Card>
                <CardHeader>
                  <CardTitle>Search Sales</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Search by invoice number, amount, or payment method..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Button
                      variant={showTrash ? "destructive" : "outline"}
                      onClick={() => setShowTrash(!showTrash)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {showTrash ? "Active Sales" : "Trash"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Sales List */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>
                      {showTrash ? "Deleted Sales" : "Active Sales"} ({filteredSales.length})
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Loading sales...</p>
                    </div>
                  ) : filteredSales.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        {showTrash ? "No deleted sales found" : "No sales found"}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredSales.map((sale) => (
                        <div key={sale.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div>
                                <h3 className="font-semibold">{sale.invoiceNumber}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {formatDistanceToNow(new Date(sale.createdAt), { addSuffix: true })}
                                </p>
                              </div>
                              <Badge variant={sale.deleted ? "destructive" : "default"}>
                                {sale.deleted ? "Deleted" : "Active"}
                              </Badge>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">₹{sale.totalAmount}</p>
                              <p className="text-sm text-muted-foreground capitalize">
                                {sale.paymentMethod}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 mb-3">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <User className="h-4 w-4" />
                              <span>User ID: {sale.userId.slice(0, 8)}</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Package className="h-4 w-4" />
                              <span>
                                {normalizeItems(sale.items).length} items
                              </span>
                            </div>
                          </div>

                          <Separator className="my-3" />

                          <div className="flex gap-2">
                            {!sale.deleted ? (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleReturnSale(sale)}
                                >
                                  <RotateCcw className="mr-2 h-4 w-4" />
                                  Return/Edit
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handlePrintSale(sale)}
                                >
                                  Print Bill
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDeleteSale(sale.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </Button>
                              </>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRestoreSale(sale.id)}
                              >
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Restore
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>

      {/* Return Modal */}
      <Dialog open={showReturnModal} onOpenChange={setShowReturnModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Process Return - {selectedSale?.invoiceNumber}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select the quantity of each item to return. Inventory will be automatically updated.
            </p>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {returnItems.map((item) => (
                <div key={item.productId} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      ₹{item.price} • Max: {item.maxQuantity}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateReturnQuantity(item.productId, item.quantity - 1)}
                      disabled={item.quantity <= 0}
                    >
                      -
                    </Button>
                    <span className="w-12 text-center">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateReturnQuantity(item.productId, item.quantity + 1)}
                      disabled={item.quantity >= item.maxQuantity}
                    >
                      +
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowReturnModal(false)}>
                Cancel
              </Button>
              <Button 
                onClick={processReturn}
                disabled={returnSaleMutation.isPending}
              >
                {returnSaleMutation.isPending ? "Processing..." : "Process Return"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </RequireAuth>
  );
}
