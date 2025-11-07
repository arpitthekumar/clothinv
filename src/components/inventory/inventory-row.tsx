"use client";

import { Edit, QrCode, Trash2, RotateCcw, XCircle } from "lucide-react";
import { LabelPreviewDialog } from "@/components/shared/label-preview-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Product } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";

interface InventoryRowProps {
  product: Product;
  categories: any[];
  showTrash: boolean;
  onEdit?: (product: Product) => void;
  stats?: {
    revenue: number;
    cost: number;
    profit: number;
    quantity: number;
  };
}

export function InventoryRow({
  product,
  categories,
  showTrash,
  onEdit,
  stats,
}: InventoryRowProps) {
  const { toast } = useToast();
  const [showLabel, setShowLabel] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmPermanentDelete, setConfirmPermanentDelete] = useState(false);
  const { user } = useAuth();

  // ✅ Role checks
  const isSystemAdmin = user?.role === "admin" && user?.username?.toLowerCase() === "admin";
  const isAdmin = user?.role === "admin";
  const isEmployee = user?.role === "employee";
  

  // 🗑️ Move to trash
  const deleteMutation = useMutation({
    mutationFn: async (productId: string) => {
      await apiRequest("DELETE", "/api/products", { id: productId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Product moved to trash" });
    },
    onError: (err: Error) =>
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      }),
  });

  // 🔄 Restore product
  const restoreMutation = useMutation({
    mutationFn: async (productId: string) =>
      apiRequest("POST", `/api/products/${productId}/restore`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Product restored" });
    },
    onError: (err: Error) =>
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      }),
  });

  // ❌ Permanent delete
  const permanentDeleteMutation = useMutation({
    mutationFn: async (productId: string) => {
      await apiRequest("DELETE", `/api/products/${productId}/permanent`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Product permanently deleted",
        description: "This product has been removed completely.",
      });
    },
    onError: (err: Error) =>
      toast({
        title: "Error deleting product",
        description: err.message,
        variant: "destructive",
      }),
  });

  const getStockStatus = (stock: number, minStock: number = 5) => {
    if (stock === 0)
      return { label: "Out of Stock", variant: "destructive" as const };
    if (stock <= minStock)
      return { label: "Low Stock", variant: "secondary" as const };
    return { label: "In Stock", variant: "default" as const };
  };

  const category = categories.find((c: any) => c.id === product.categoryId);

  return (
    <>
      <tr className="hover:bg-muted/50 align-top border-b">
        <td className="p-2 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="min-w-0">
              <p className="font-medium truncate text-sm sm:text-base">
                {product.name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                SKU: {product.sku}
              </p>
              <div className="flex flex-wrap gap-1 mt-1 sm:hidden">
                <Badge variant="outline">
                  {category?.name || "Uncategorized"}
                </Badge>
                <Badge
                  variant={
                    getStockStatus(product.stock, product.minStock ?? undefined)
                      .variant
                  }
                >
                  {
                    getStockStatus(product.stock, product.minStock ?? undefined)
                      .label
                  }
                </Badge>
              </div>
            </div>
          </div>
        </td>

        <td className="p-2 sm:p-4 hidden sm:table-cell">
          <Badge
            variant="outline"
            className="capitalize bg-gray-100 text-gray-800 border-gray-300"
          >
            {category?.name || "Uncategorized"}
          </Badge>
        </td>

        <td className="p-2 sm:p-4 text-sm hidden md:table-cell">
          {product.size || "-"}
        </td>

        <td className="p-2 sm:p-4 text-sm">{product.stock} units</td>

        <td className="p-2 sm:p-4 font-medium text-sm sm:text-base">
          <div>₹{product.price}</div>
          {!isEmployee && product.buyingPrice && (
            <div className="text-xs text-muted-foreground font-normal">
              Cost: ₹{product.buyingPrice}
            </div>
          )}
        </td>

        {/* ✅ Only show for Admins and System Admins */}
        {!isEmployee ? (
          <td className="p-2 sm:p-4  text-sm">
            {stats ? (
              <div className="space-y-1">
                <div>
                  Profit:
                  <span
                    className={`ml-1 font-semibold ${
                      stats.profit >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    ₹{stats.profit.toFixed(2)}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Revenue: ₹{stats.revenue.toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Cost: ₹{stats.cost.toFixed(2)} • Sold: {stats.quantity}
                </div>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">No sales</span>
            )}
          </td>
        ) : (
          <td className="p-2 sm:p-4 hidden lg:table-cell text-sm text-muted-foreground text-center">
            —
          </td>
        )}

        <td className="p-2 sm:p-4 hidden sm:table-cell">
          <Badge
            variant={
              getStockStatus(product.stock, product.minStock ?? undefined)
                .variant
            }
            className="whitespace-nowrap flex items-center justify-center text-sm font-medium px-3 py-1"
          >
            {getStockStatus(product.stock, product.minStock ?? undefined).label}
          </Badge>
        </td>

        <td className="p-2 sm:p-4">
          <div className="flex gap-1 sm:gap-2 flex-wrap md:flex-nowrap">
            {showTrash ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => restoreMutation.mutate(product.id)}
                >
                  <RotateCcw className="h-4 w-4 text-blue-600" />
                </Button>

                {isSystemAdmin && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmPermanentDelete(true)}
                  >
                    <XCircle className="h-4 w-4 text-red-600" />
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit?.(product)}
                >
                  <Edit className="h-4 w-4 text-blue-600" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowLabel(true)}
                >
                  <QrCode className="h-4 w-4 text-green-600" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>

                <LabelPreviewDialog
                  open={showLabel}
                  onOpenChange={setShowLabel}
                  product={{
                    id: product.id,
                    name: product.name,
                    sku: product.sku,
                    price: product.price,
                    size: product.size || null,
                    categoryName: category?.name || null,
                    barcode: product.barcode || undefined,
                  }}
                />
              </>
            )}
          </div>
        </td>
      </tr>

      {/* 🗑️ Move to Trash confirmation */}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Move to Trash?</AlertDialogTitle>
            <AlertDialogDescription>
              This product will be moved to trash. You can restore it later if
              needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(product.id)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Move to Trash
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 🧨 Permanent Delete confirmation */}
      {isSystemAdmin && (
        <AlertDialog
          open={confirmPermanentDelete}
          onOpenChange={setConfirmPermanentDelete}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Permanently?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove the product from your inventory.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => permanentDeleteMutation.mutate(product.id)}
                className="bg-red-700 hover:bg-red-800 text-white"
              >
                Delete Permanently
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
