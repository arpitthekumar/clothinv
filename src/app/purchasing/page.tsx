"use client";

import { useState } from "react";
import { Sidebar } from "@/components/shared/sidebar";
import { Header } from "@/components/shared/header";
import RequireAuth from "../_components/require-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function Page() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const [newPO, setNewPO] = useState<{ supplierId: string; expectedDate?: string; notes?: string }>({ supplierId: "" });
  const [poItem, setPoItem] = useState<{ purchaseOrderId: string; productId: string; quantityOrdered: string; unitCost: string }>({ purchaseOrderId: "", productId: "", quantityOrdered: "", unitCost: "" });
  const [receive, setReceive] = useState<{ purchaseOrderItemId: string; quantity: string }>({ purchaseOrderItemId: "", quantity: "" });
  const [newSupplier, setNewSupplier] = useState<{ name: string; phone?: string; email?: string; address?: string; notes?: string }>({ name: "" });

  const { data: suppliers = [] } = useQuery<any[]>({
    queryKey: ["/api/suppliers"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });
  const { data: purchaseOrders = [] } = useQuery<any[]>({
    queryKey: ["/api/purchase-orders"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const createPOMutation = useMutation({
    mutationFn: async () => {
      const body: any = { supplierId: newPO.supplierId, status: "ordered" };
      if (newPO.expectedDate) body.expectedDate = new Date(newPO.expectedDate);
      if (newPO.notes) body.notes = newPO.notes;
      const res = await apiRequest("POST", "/api/purchase-orders", body);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchase-orders"] });
      setNewPO({ supplierId: "" });
    },
  });

  const createSupplierMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/suppliers", newSupplier);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      setNewSupplier({ name: "" });
    },
  });

  const addItemMutation = useMutation({
    mutationFn: async () => {
      const body = {
        purchaseOrderId: poItem.purchaseOrderId,
        productId: poItem.productId,
        quantityOrdered: parseInt(poItem.quantityOrdered || "0", 10),
        unitCost: poItem.unitCost,
      };
      const res = await apiRequest("PUT", "/api/purchase-orders", body);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchase-orders"] });
      setPoItem({ purchaseOrderId: "", productId: "", quantityOrdered: "", unitCost: "" });
    },
  });

  const receiveMutation = useMutation({
    mutationFn: async () => {
      const body = { items: [{ purchaseOrderItemId: receive.purchaseOrderItemId, quantity: parseInt(receive.quantity || "0", 10) }] };
      const res = await apiRequest("POST", "/api/purchase-orders/receive", body);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setReceive({ purchaseOrderItemId: "", quantity: "" });
    },
  });

  return (
    <RequireAuth>
      <div className="flex h-dvh md:h-screen overflow-hidden bg-background">
        <Sidebar isOpen={sidebarOpen} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header
            title="Purchasing"
            subtitle="Create POs and receive stock"
            onSidebarToggle={toggleSidebar}
          />
          <main className="flex-1 overflow-auto p-4 md:p-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Create Purchase Order</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Supplier</label>
                      <Select value={newPO.supplierId} onValueChange={(v) => setNewPO((s) => ({ ...s, supplierId: v }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select supplier" />
                        </SelectTrigger>
                        <SelectContent>
                          {suppliers.map((s: any) => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className=" text-white">
                      <label className="text-sm font-medium  mb-2 block">Expected Date</label>
                      <Input type="date" value={newPO.expectedDate || ""} onChange={(e) => setNewPO((s) => ({ ...s, expectedDate: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Notes</label>
                      <Input placeholder="Optional" value={newPO.notes || ""} onChange={(e) => setNewPO((s) => ({ ...s, notes: e.target.value }))} />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button onClick={() => createPOMutation.mutate()} disabled={!newPO.supplierId}>Create PO</Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline">+ Add Supplier</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Supplier</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-3">
                          <div>
                            <label className="text-sm font-medium mb-2 block">Name</label>
                            <Input value={newSupplier.name} onChange={(e) => setNewSupplier((s) => ({ ...s, name: e.target.value }))} />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="text-sm font-medium mb-2 block">Phone</label>
                              <Input value={newSupplier.phone || ""} onChange={(e) => setNewSupplier((s) => ({ ...s, phone: e.target.value }))} />
                            </div>
                            <div>
                              <label className="text-sm font-medium mb-2 block">Email</label>
                              <Input value={newSupplier.email || ""} onChange={(e) => setNewSupplier((s) => ({ ...s, email: e.target.value }))} />
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-2 block">Address</label>
                            <Input value={newSupplier.address || ""} onChange={(e) => setNewSupplier((s) => ({ ...s, address: e.target.value }))} />
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-2 block">Notes</label>
                            <Input value={newSupplier.notes || ""} onChange={(e) => setNewSupplier((s) => ({ ...s, notes: e.target.value }))} />
                          </div>
                          <Button onClick={() => createSupplierMutation.mutate()} disabled={!newSupplier.name}>Save Supplier</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Add Item to PO</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="text-sm font-medium mb-2 block">PO</label>
                      <Select value={poItem.purchaseOrderId} onValueChange={(v) => setPoItem((s) => ({ ...s, purchaseOrderId: v }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select PO" />
                        </SelectTrigger>
                        <SelectContent>
                          {purchaseOrders.map((po: any) => (
                            <SelectItem key={po.id} value={po.id}>{po.id.slice(0, 8)} • {po.status}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Product ID</label>
                      <Input placeholder="product id" value={poItem.productId} onChange={(e) => setPoItem((s) => ({ ...s, productId: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Quantity</label>
                      <Input type="number" placeholder="0" value={poItem.quantityOrdered} onChange={(e) => setPoItem((s) => ({ ...s, quantityOrdered: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Unit Cost</label>
                      <Input placeholder="0.00" value={poItem.unitCost} onChange={(e) => setPoItem((s) => ({ ...s, unitCost: e.target.value }))} />
                    </div>
                  </div>
                  <Button onClick={() => addItemMutation.mutate()} disabled={!poItem.purchaseOrderId || !poItem.productId}>Add Item</Button>
                </CardContent>
              </Card>

              <Card id="receive">
                <CardHeader>
                  <CardTitle>Receive Items</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-sm font-medium mb-2 block">PO Item ID</label>
                      <Input placeholder="purchase_order_item id" value={receive.purchaseOrderItemId} onChange={(e) => setReceive((s) => ({ ...s, purchaseOrderItemId: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Quantity Received</label>
                      <Input type="number" placeholder="0" value={receive.quantity} onChange={(e) => setReceive((s) => ({ ...s, quantity: e.target.value }))} />
                    </div>
                  </div>
                  <Button onClick={() => receiveMutation.mutate()} disabled={!receive.purchaseOrderItemId || !receive.quantity}>Receive</Button>
                  <Separator className="my-2" />
                  <div className="text-xs text-muted-foreground">Tip: Use the PO list to find item IDs. This will update stock and cost history.</div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </RequireAuth>
  );
}


