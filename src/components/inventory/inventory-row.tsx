"use client";

import { Edit, QrCode, Trash2, RotateCcw, Package } from "lucide-react";
import { LabelPreviewDialog } from "@/components/shared/label-preview-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Product } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface InventoryRowProps {
  product: Product;
  categories: any[];
  showTrash: boolean;
  onEdit?: (product: Product) => void;
}

export function InventoryRow({ product, categories, showTrash, onEdit }: InventoryRowProps) {
  const { toast } = useToast();
  const [showLabel, setShowLabel] = (require("react") as typeof import("react")).useState(false);

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
    <tr className="hover:bg-muted/50">
      <td className="p-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
            <Package className="text-muted-foreground h-6 w-6" />
          </div>
          <div>
            <p className="font-medium">{product.name}</p>
            <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
          </div>
        </div>
      </td>
      <td className="p-4">
        <Badge variant="outline">{category?.name || "Uncategorized"}</Badge>
      </td>
      <td className="p-4 text-sm">{product.size || "-"}</td>
      <td className="p-4">{product.stock} units</td>
      <td className="p-4 font-medium">₹{product.price}</td>
      <td className="p-4">
        <Badge variant={getStockStatus(product.stock, product.minStock ?? undefined).variant}>
          {getStockStatus(product.stock, product.minStock ?? undefined).label}
        </Badge>
      </td>
      <td className="p-4">
        <div className="flex space-x-2">
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
                onClick={() => deleteMutation.mutate(product.id)}
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
  );
}
