"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Percent,
  Calendar,
  User
} from "lucide-react";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

export function CouponsManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<any>(null);
  const [newCoupon, setNewCoupon] = useState({ name: "", percentage: "" });
  const [editCoupon, setEditCoupon] = useState({ name: "", percentage: "", active: true });
  
  const { toast } = useToast();

  const { data: coupons = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/coupons"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const createCouponMutation = useMutation({
    mutationFn: async (couponData: any) => {
      const res = await apiRequest("POST", "/api/coupons", couponData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coupons"] });
      setShowAddModal(false);
      setNewCoupon({ name: "", percentage: "" });
      toast({
        title: "Coupon Created",
        description: "Discount coupon created successfully",
      });
    },
  });

  const updateCouponMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PUT", `/api/coupons/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coupons"] });
      setShowEditModal(false);
      setSelectedCoupon(null);
      toast({
        title: "Coupon Updated",
        description: "Discount coupon updated successfully",
      });
    },
  });

  const deleteCouponMutation = useMutation({
    mutationFn: async (couponId: string) => {
      const res = await apiRequest("DELETE", `/api/coupons/${couponId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coupons"] });
      toast({
        title: "Coupon Deleted",
        description: "Discount coupon deleted successfully",
      });
    },
  });

  const filteredCoupons = coupons.filter(coupon =>
    coupon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coupon.percentage.toString().includes(searchTerm)
  );

  const handleAddCoupon = () => {
    if (!newCoupon.name.trim() || !newCoupon.percentage.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const percentage = parseFloat(newCoupon.percentage);
    if (isNaN(percentage) || percentage <= 0 || percentage > 100) {
      toast({
        title: "Invalid Percentage",
        description: "Percentage must be between 1 and 100",
        variant: "destructive",
      });
      return;
    }

    createCouponMutation.mutate({
      name: newCoupon.name.trim().toUpperCase(),
      percentage: percentage.toFixed(2),
    });
  };

  const handleEditCoupon = (coupon: any) => {
    setSelectedCoupon(coupon);
    setEditCoupon({
      name: coupon.name,
      percentage: coupon.percentage.toString(),
      active: coupon.active,
    });
    setShowEditModal(true);
  };

  const handleUpdateCoupon = () => {
    if (!editCoupon.name.trim() || !editCoupon.percentage.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const percentage = parseFloat(editCoupon.percentage);
    if (isNaN(percentage) || percentage <= 0 || percentage > 100) {
      toast({
        title: "Invalid Percentage",
        description: "Percentage must be between 1 and 100",
        variant: "destructive",
      });
      return;
    }

    updateCouponMutation.mutate({
      id: selectedCoupon.id,
      data: {
        name: editCoupon.name.trim().toUpperCase(),
        percentage: percentage.toFixed(2),
        active: editCoupon.active,
      },
    });
  };

  const handleDeleteCoupon = (couponId: string) => {
    if (confirm("Are you sure you want to delete this coupon?")) {
      deleteCouponMutation.mutate(couponId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Discount Coupons</h2>
          <p className="text-muted-foreground">Manage discount coupons for your store</p>
        </div>
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Coupon
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Coupon</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Coupon Name</label>
                <Input
                  placeholder="e.g., WELCOME10"
                  value={newCoupon.name}
                  onChange={(e) => setNewCoupon(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Discount Percentage</label>
                <Input
                  type="number"
                  placeholder="e.g., 10"
                  min="1"
                  max="100"
                  value={newCoupon.percentage}
                  onChange={(e) => setNewCoupon(prev => ({ ...prev, percentage: e.target.value }))}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddCoupon}
                  disabled={createCouponMutation.isPending}
                >
                  {createCouponMutation.isPending ? "Creating..." : "Create Coupon"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search coupons by name or percentage..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Coupons List */}
      <Card>
        <CardHeader>
          <CardTitle>Active Coupons ({filteredCoupons.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading coupons...</p>
            </div>
          ) : filteredCoupons.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {searchTerm ? "No coupons found matching your search" : "No coupons created yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCoupons.map((coupon) => (
                <div key={coupon.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Percent className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{coupon.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {coupon.percentage}% discount
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={coupon.active ? "default" : "secondary"}>
                        {coupon.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 mb-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {(() => {
                        const raw = coupon?.createdAt;
                        const created = raw ? new Date(raw) : null;
                        const isValid = created && !isNaN(created.getTime());
                        const text = isValid ? formatDistanceToNow(created as Date, { addSuffix: true }) : "Unknown";
                        return <span>Created {text}</span>;
                      })()}
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span>By: {coupon.createdBy?.slice(0, 8) || 'Unknown'}</span>
                    </div>
                  </div>

                  <Separator className="my-3" />

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditCoupon(coupon)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteCoupon(coupon.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Coupon</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Coupon Name</label>
              <Input
                placeholder="e.g., WELCOME10"
                value={editCoupon.name}
                onChange={(e) => setEditCoupon(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Discount Percentage</label>
              <Input
                type="number"
                placeholder="e.g., 10"
                min="1"
                max="100"
                value={editCoupon.percentage}
                onChange={(e) => setEditCoupon(prev => ({ ...prev, percentage: e.target.value }))}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="active"
                checked={editCoupon.active}
                onChange={(e) => setEditCoupon(prev => ({ ...prev, active: e.target.checked }))}
                className="rounded"
              />
              <label htmlFor="active" className="text-sm font-medium">
                Active
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateCoupon}
                disabled={updateCouponMutation.isPending}
              >
                {updateCouponMutation.isPending ? "Updating..." : "Update Coupon"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


