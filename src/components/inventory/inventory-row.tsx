"use client";

import { Edit, QrCode, Trash2, RotateCcw, Package } from "lucide-react";
import { LabelPreviewDialog } from "@/components/shared/label-preview-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Product } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";

interface InventoryRowProps {
  product: Product;
  categories: any[];
  showTrash: boolean;
  onEdit?: (product: Product) => void;
}

export function InventoryRow({ product, categories, showTrash, onEdit }: InventoryRowProps) {
  const { toast } = useToast();
  const [showLabel, setShowLabel] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: async (productId: string) => {
      await apiRequest("DELETE", "/api/products", { id: productId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Product moved to trash" });
    },
    onError: (err: Error) =>
      toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const restoreMutation = useMutation({
    mutationFn: async (productId: string) =>
      apiRequest("POST", `/api/products/${productId}/restore`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Product restored" });
    },
    onError: (err: Error) =>
      toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const getStockStatus = (stock: number, minStock: number = 5) => {
    if (stock === 0) return { label: "Out of Stock", variant: "destructive" as const };
    if (stock <= minStock) return { label: "Low Stock", variant: "secondary" as const };
    return { label: "In Stock", variant: "default" as const };
  };

  const category = categories.find((c: any) => c.id === product.categoryId);

  return (
    <>
      <tr className="hover:bg-muted/50 align-top">
        <td className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
              <Package className="text-muted-foreground h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="font-medium truncate max-w-[180px] md:max-w-none">{product.name}</p>
              <p className="text-xs md:text-sm text-muted-foreground truncate">SKU: {product.sku}</p>
            </div>
          </div>
        </td>
        <td className="p-4 hidden lg:table-cell">
          <Badge variant="outline">{category?.name || "Uncategorized"}</Badge>
        </td>
        <td className="p-4 text-sm hidden lg:table-cell">{product.size || "-"}</td>
        <td className="p-4">{product.stock} units</td>
        <td className="p-4 font-medium">₹{product.price}</td>
        <td className="p-4 hidden sm:table-cell">
          <Badge variant={getStockStatus(product.stock, product.minStock ?? undefined).variant}>
            {getStockStatus(product.stock, product.minStock ?? undefined).label}
          </Badge>
        </td>
        <td className="p-4">
          <div className="flex gap-2 flex-wrap md:flex-nowrap">
            {showTrash ? (
              <Button variant="ghost" size="sm" onClick={() => restoreMutation.mutate(product.id)}>
                <RotateCcw className="h-4 w-4 text-blue-600" />
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => onEdit?.(product)}>
                  <Edit className="h-4 w-4 text-blue-600" />
                </Button>

                <Button variant="ghost" size="sm" onClick={() => setShowLabel(true)}>
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

      {/* Confirmation dialog */}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Move to Trash?</AlertDialogTitle>
            <AlertDialogDescription>
              This product will be moved to the trash. You can restore it later if needed.
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
    </>
  );
}
