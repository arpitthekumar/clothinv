// "use client";

import SalesPage from "@/components/sales/SalesPage";

// import { useState } from "react";
// import { ThankYouModal } from "@/components/pos/ThankYouModal"; // adjust path if needed
// import { Sidebar } from "@/components/shared/sidebar";
// import { Header } from "@/components/shared/header";
// import RequireAuth from "../_components/require-auth";
// import { useQuery, useMutation } from "@tanstack/react-query";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Badge } from "@/components/ui/badge";
// import { Separator } from "@/components/ui/separator";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { Search, Trash2, RotateCcw, User, Package } from "lucide-react";
// import { XCircle } from "lucide-react";
// import { apiRequest, queryClient } from "@/lib/queryClient";
// import { useToast } from "@/hooks/use-toast";
// import { type InvoiceData } from "@/lib/printer";
// import { normalizeItems } from "@/lib/json";
// import { useAuth } from "@/hooks/use-auth";
// import { formatDistanceToNow } from "date-fns";
// import { toZonedTime } from "date-fns-tz"; // 👈 Add this import

// export default function SalesPage() {
//   const [thankYouOpen, setThankYouOpen] = useState(false);
//   const [currentInvoice, setCurrentInvoice] = useState<InvoiceData | null>(
//     null
//   );
//   const [customerPhone, setCustomerPhone] = useState("");
//   const { user } = useAuth();

//   const isSystemAdmin =
//     user?.role === "admin" && user?.username?.toLowerCase() === "admin";

//   const [sidebarOpen, setSidebarOpen] = useState(true);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [showTrash, setShowTrash] = useState(false);
//   const [selectedSale, setSelectedSale] = useState<any>(null);
//   const [showReturnModal, setShowReturnModal] = useState(false);
//   const [returnItems, setReturnItems] = useState<
//     Array<{
//       productId: string;
//       quantity: number;
//       maxQuantity: number;
//       name: string;
//       price: string;
//     }>
//   >([]);

//   const { toast } = useToast();
//   const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
//   const handlePrintSale = async (sale: any) => {
//     try {
//       const items = normalizeItems(sale.items);
//       // Round all values
//       const subtotal = Math.round(parseFloat(sale.subtotal || "0") * 100) / 100;
//       const discountAmount =
//         Math.round(parseFloat(sale.discount_amount || "0") * 100) / 100;
//       const total =
//         Math.round(parseFloat(sale.total_amount || "0") * 100) / 100;

//       const invoice: InvoiceData = {
//         invoiceNumber: sale.invoice_number || `INV-${sale.id?.slice(0, 6)}`,
//         date: new Date(sale.created_at || Date.now()),
//         items: items.map((it: any) => ({
//           name: it.name,
//           quantity: it.quantity,
//           price: Math.round(parseFloat(it.price) * 100) / 100,
//           total: Math.round(parseFloat(it.price) * it.quantity * 100) / 100,
//         })),
//         subtotal: subtotal,
//         tax: Math.round(parseFloat(sale.tax_amount || "0") * 100) / 100,
//         total: total,
//         paymentMethod: sale.payment_method,
//         customerName: sale.customer_name || "Walk-in Customer",
//         discountType: sale.discount_type || "percentage",
//         discountValue:
//           Math.round(parseFloat(sale.discount_value || 0) * 100) / 100,
//         discountAmount: discountAmount,
//       };

//       // Set invoice and open ThankYou modal
//       setCurrentInvoice(invoice);
//       setCustomerPhone(sale.customer_phone || "");
//       setThankYouOpen(true);
//     } catch (e: any) {
//       toast({
//         title: "Error",
//         description: e?.message || "Unable to prepare invoice for viewing",
//         variant: "destructive",
//       });
//     }
//   };

//   const {
//     data: sales = [],
//     isLoading,
//     refetch,
//   } = useQuery<any[]>({
//     queryKey: ["/api/sales", { includeDeleted: true }],
//     queryFn: async () => {
//       const response = await fetch("/api/sales?includeDeleted=true", {
//         headers: { "Content-Type": "application/json" },
//       });
//       if (!response.ok) return [];
//       return response.json();
//     },
//   });
//   // console.log("Fetched sales:", sales);

//   const deleteSaleMutation = useMutation({
//     mutationFn: async (saleId: string) => {
//       const res = await apiRequest("DELETE", `/api/sales/${saleId}`);
//       return res.json();
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
//       refetch();
//       toast({
//         title: "Sale Deleted",
//         description: "Sale has been moved to trash",
//       });
//     },
//   });

//   const restoreSaleMutation = useMutation({
//     mutationFn: async (saleId: string) => {
//       const res = await apiRequest("POST", `/api/sales/${saleId}/restore`);
//       return res.json();
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
//       toast({
//         title: "Sale Restored",
//         description: "Sale has been restored from trash",
//       });
//     },
//   });

//   // Permanent delete mutation (admin-only)
//   const permanentDeleteMutation = useMutation({
//     mutationFn: async (saleId: string) => {
//       const res = await apiRequest("DELETE", `/api/sales/${saleId}/permanent`);
//       return res.json();
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
//       toast({
//         title: "Sale Deleted",
//         description: "Sale has been permanently deleted",
//       });
//     },
//     onError: (err: any) => {
//       toast({
//         title: "Error",
//         description: err?.message || "Failed to delete sale",
//         variant: "destructive",
//       });
//     },
//   });

//   const returnSaleMutation = useMutation({
//     mutationFn: async (returnData: any) => {
//       const res = await apiRequest("POST", "/api/sales/returns", returnData);
//       return res.json();
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
//       queryClient.invalidateQueries({ queryKey: ["/api/products"] });
//       queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
//       setShowReturnModal(false);
//       setReturnItems([]);
//       setSelectedSale(null);
//       toast({
//         title: "Return Processed",
//         description: "Items have been returned and inventory updated",
//       });
//     },
//   });

//   const filteredSales = sales.filter((sale) => {
//     const matchesSearch =
//       (sale?.invoice_number?.toLowerCase() || "").includes(
//         searchTerm.toLowerCase()
//       ) ||
//       (sale?.total_amount?.toString() || "").includes(searchTerm) ||
//       (sale?.payment_method?.toLowerCase() || "").includes(
//         searchTerm.toLowerCase()
//       );
//     const matchesTrashFilter = showTrash ? sale?.deleted : !sale?.deleted;
//     return matchesSearch && matchesTrashFilter;
//   });

//   const handleDeleteSale = (saleId: string) => {
//     if (
//       confirm(
//         "Are you sure you want to delete this sale? It will be moved to trash."
//       )
//     ) {
//       deleteSaleMutation.mutate(saleId);
//     }
//   };

//   const handleRestoreSale = (saleId: string) => {
//     if (
//       confirm(
//         "Are you sure you want to restore this sale? It will be moved back to active sales."
//       )
//     ) {
//       restoreSaleMutation.mutate(saleId);
//     }
//   };

//   const handlePermanentDelete = (saleId: string) => {
//     if (
//       confirm(
//         "Are you sure you want to permanently delete this sale? This action cannot be undone."
//       )
//     ) {
//       permanentDeleteMutation.mutate(saleId);
//     }
//   };

//   const handleReturnSale = (sale: any) => {
//     setSelectedSale(sale);
//     const items = normalizeItems(sale.items);
//     const returnItemsData = (Array.isArray(items) ? items : []).map(
//       (item: any) => ({
//         productId: item.productId,
//         quantity: 0,
//         maxQuantity: item.quantity,
//         name: item.name,
//         price: item.price || "0",
//       })
//     );
//     setReturnItems(returnItemsData);
//     setShowReturnModal(true);
//   };

//   const updateReturnQuantity = (productId: string, quantity: number) => {
//     setReturnItems((prev) =>
//       prev.map((item) =>
//         item.productId === productId
//           ? {
//               ...item,
//               quantity: Math.min(Math.max(0, quantity), item.maxQuantity),
//             }
//           : item
//       )
//     );
//   };

//   const processReturn = () => {
//     const itemsToReturn = returnItems.filter((item) => item.quantity > 0);
//     if (itemsToReturn.length === 0) {
//       toast({
//         title: "No Items Selected",
//         description: "Please select items to return",
//         variant: "destructive",
//       });
//       return;
//     }

//     const returnData = {
//       saleId: selectedSale.id,
//       items: itemsToReturn.map((item) => ({
//         productId: item.productId,
//         quantity: item.quantity,
//         refundAmount: (parseFloat(item.price) * item.quantity).toFixed(2),
//       })),
//     };

//     returnSaleMutation.mutate(returnData);
//   };

//   return (
//     <RequireAuth>
//       <div className="flex h-dvh md:h-screen overflow-hidden bg-background">
//         <Sidebar isOpen={sidebarOpen} />
//         <div className="flex-1 flex flex-col overflow-hidden">
//           <Header
//             title="Sales Management"
//             subtitle="View, manage, and process returns for sales"
//             onSidebarToggle={toggleSidebar}
//           />
//           <main className="flex-1 overflow-auto p-4 md:p-6">
//             <div className="space-y-6">
//               {/* Search and Filters */}
//               <Card>
//                 <CardHeader>
//                   <CardTitle>Search Sales</CardTitle>
//                 </CardHeader>
//                 <CardContent className="space-y-4">
//                   <div className="flex gap-4">
//                     <div className="relative flex-1">
//                       <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
//                       <Input
//                         placeholder="Search by invoice number, amount, or payment method..."
//                         value={searchTerm}
//                         onChange={(e) => setSearchTerm(e.target.value)}
//                         className="pl-10"
//                       />
//                     </div>
//                     <Button
//                       variant={showTrash ? "destructive" : "outline"}
//                       onClick={() => setShowTrash(!showTrash)}
//                     >
//                       <Trash2 className="mr-2 h-4 w-4" />
//                       {showTrash ? "Active Sales" : "Trash"}
//                     </Button>
//                   </div>
//                 </CardContent>
//               </Card>

//               {/* Sales List */}
//               <Card>
//                 <CardHeader>
//                   <CardTitle className="flex items-center justify-between">
//                     <span>
//                       {showTrash ? "Deleted Sales" : "Active Sales"} (
//                       {filteredSales.length})
//                     </span>
//                   </CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   {isLoading ? (
//                     <div className="text-center py-8">
//                       <p className="text-muted-foreground">Loading sales...</p>
//                     </div>
//                   ) : filteredSales.length === 0 ? (
//                     <div className="text-center py-8">
//                       <p className="text-muted-foreground">
//                         {showTrash
//                           ? "No deleted sales found"
//                           : "No sales found"}
//                       </p>
//                     </div>
//                   ) : (
//                     <div className="space-y-4">
//                       {filteredSales.map((sale) => (
//                         <div key={sale.id} className="border rounded-lg p-4">
//                           <div className="flex items-center justify-between mb-3">
//                             <div className="flex items-center gap-3">
//                               <div>
//                                 <h3 className="font-semibold">
//                                   {sale.invoice_number}
//                                 </h3>
//                                 <p className="text-sm text-muted-foreground">
//                                   {(() => {
//                                     try {
//                                       const raw = sale.created_at || new Date();
//                                       const utcDate = new Date(
//                                         typeof raw === "string"
//                                           ? raw.replace(" ", "T") + "Z"
//                                           : raw
//                                       );
//                                       const istDate = toZonedTime(
//                                         utcDate,
//                                         "Asia/Kolkata"
//                                       );

//                                       return formatDistanceToNow(istDate, {
//                                         addSuffix: true,
//                                       });
//                                     } catch {
//                                       return "Invalid date";
//                                     }
//                                   })()}
//                                 </p>
//                               </div>
//                               <Badge
//                                 variant={
//                                   sale.deleted ? "destructive" : "default"
//                                 }
//                               >
//                                 {sale.deleted ? "Deleted" : "Active"}
//                               </Badge>
//                             </div>
//                             <div className="text-right">
//                               <p className="font-semibold">
//                                 ₹
//                                 {Number(sale.total_amount || 0).toLocaleString(
//                                   "en-IN",
//                                   {
//                                     minimumFractionDigits: 0,
//                                     maximumFractionDigits: 0,
//                                   }
//                                 )}
//                               </p>

//                               {(() => {
//                                 const method =
//                                   sale.payment_method?.toLowerCase() || "other";

//                                 let colorClasses = "";
//                                 switch (method) {
//                                   case "upi":
//                                     colorClasses = "text-green-600";
//                                     break;
//                                   case "cash":
//                                     colorClasses = "text-yellow-600";
//                                     break;
//                                   case "card":
//                                     colorClasses = "text-blue-600";
//                                     break;
//                                   default:
//                                     colorClasses = "text-gray-600";
//                                     break;
//                                 }

//                                 return (
//                                   <p
//                                     className={`text-sm font-medium capitalize ${colorClasses}`}
//                                   >
//                                     {sale.payment_method || "Other"}
//                                   </p>
//                                 );
//                               })()}
//                             </div>
//                           </div>

//                           <div className="flex items-center gap-2 mb-3">
//                             <div className="flex items-center gap-1 text-sm text-muted-foreground">
//                               <User className="h-4 w-4" />
//                               <span>User ID: {sale.user_id?.slice(0, 8)}</span>
//                             </div>
//                             <div className="flex items-center gap-1 text-sm text-muted-foreground">
//                               <Package className="h-4 w-4" />
//                               <span>
//                                 {normalizeItems(sale.items).length} items
//                               </span>
//                             </div>
//                           </div>

//                           <Separator className="my-3" />

//                           <div className="flex flex-col sm:flex-row sm:gap-2 gap-2 w-full">
//                             {!sale.deleted ? (
//                               <>
//                                 <Button
//                                   variant="outline"
//                                   size="sm"
//                                   className="w-full sm:w-auto flex items-center justify-center"
//                                   onClick={() => handleReturnSale(sale)}
//                                 >
//                                   <RotateCcw className="mr-2 h-4 w-4" />
//                                   Return/Edit
//                                 </Button>

//                                 <Button
//                                   variant="outline"
//                                   size="sm"
//                                   className="w-full sm:w-auto flex items-center justify-center"
//                                   onClick={() => handlePrintSale(sale)}
//                                 >
//                                   Print Bill
//                                 </Button>

//                                 <ThankYouModal
//                                   open={thankYouOpen}
//                                   onOpenChange={setThankYouOpen}
//                                   invoiceData={currentInvoice}
//                                   customerPhone={customerPhone}
//                                 />

//                                 <Button
//                                   variant="destructive"
//                                   size="sm"
//                                   className="w-full sm:w-auto flex items-center justify-center"
//                                   onClick={() => handleDeleteSale(sale.id)}
//                                 >
//                                   <Trash2 className="mr-2 h-4 w-4" />
//                                   Delete
//                                 </Button>
//                               </>
//                             ) : (
//                               <>
//                                 <Button
//                                   variant="outline"
//                                   size="sm"
//                                   className="w-full sm:w-auto flex items-center justify-center"
//                                   onClick={() => handleRestoreSale(sale.id)}
//                                 >
//                                   <RotateCcw className="mr-2 h-4 w-4" />
//                                   Restore
//                                 </Button>
//                                 {isSystemAdmin && (
//                                   <Button
//                                     variant="destructive"
//                                     size="sm"
//                                     className="w-full sm:w-auto flex items-center justify-center"
//                                     onClick={() =>
//                                       handlePermanentDelete(sale.id)
//                                     }
//                                   >
//                                     <XCircle className="mr-2 h-4 w-4" />
//                                     Delete Permanently
//                                   </Button>
//                                 )}
//                               </>
//                             )}
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   )}
//                 </CardContent>
//               </Card>
//             </div>
//           </main>
//         </div>
//       </div>

//       {/* Return Modal */}
//       <Dialog open={showReturnModal} onOpenChange={setShowReturnModal}>
//         <DialogContent className="max-w-2xl">
//           <DialogHeader>
//             <DialogTitle>
//               Process Return - {selectedSale?.invoice_number}
//             </DialogTitle>
//           </DialogHeader>
//           <div className="space-y-4">
//             <p className="text-sm text-muted-foreground">
//               Select the quantity of each item to return. Inventory will be
//               automatically updated.
//             </p>

//             <div className="space-y-3 max-h-96 overflow-y-auto">
//               {returnItems.map((item) => (
//                 <div
//                   key={item.productId}
//                   className="flex items-center justify-between p-3 border rounded"
//                 >
//                   <div className="flex-1">
//                     <p className="font-medium">{item.name}</p>
//                     <p className="text-sm text-muted-foreground">
//                       ₹{item.price} • Max: {item.maxQuantity}
//                     </p>
//                   </div>
//                   <div className="flex items-center gap-2">
//                     <Button
//                       variant="outline"
//                       size="sm"
//                       onClick={() =>
//                         updateReturnQuantity(item.productId, item.quantity - 1)
//                       }
//                       disabled={item.quantity <= 0}
//                     >
//                       -
//                     </Button>
//                     <span className="w-12 text-center">{item.quantity}</span>
//                     <Button
//                       variant="outline"
//                       size="sm"
//                       onClick={() =>
//                         updateReturnQuantity(item.productId, item.quantity + 1)
//                       }
//                       disabled={item.quantity >= item.maxQuantity}
//                     >
//                       +
//                     </Button>
//                   </div>
//                 </div>
//               ))}
//             </div>

//             <div className="flex justify-end gap-2 pt-4">
//               <Button
//                 variant="outline"
//                 onClick={() => setShowReturnModal(false)}
//               >
//                 Cancel
//               </Button>
//               <Button
//                 onClick={processReturn}
//                 disabled={returnSaleMutation.isPending}
//               >
//                 {returnSaleMutation.isPending
//                   ? "Processing..."
//                   : "Process Return"}
//               </Button>
//             </div>
//           </div>
//         </DialogContent>
//       </Dialog>
//     </RequireAuth>
//   );
// }

export default function Sales() {
  return (
    <div>
      <SalesPage />
    </div>
  );
}
