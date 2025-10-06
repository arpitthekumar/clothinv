"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { insertProductSchema, type Product } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { offlineStorage } from "@/lib/offline-storage";
import { AddCategoryModal } from "@/components/shared/add-category-modal";
import { Plus, RefreshCw, QrCode, Printer, Download } from "lucide-react";
import { LabelPreviewDialog } from "@/components/shared/label-preview-dialog";
import { z } from "zod";

const formSchema = insertProductSchema.extend({
  price: z.string().min(1, "Price is required"),
  stock: z.string().min(1, "Stock is required"),
  minStock: z.string().optional(),
  description: z.string().optional(),
  size: z.string().optional(),
  barcode: z.string().optional(),
  categoryId: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProduct?: Partial<Product>;
}

// Helper functions for auto-generation
const generateSKU = (productName: string): string => {
  const timestamp = Date.now().toString().slice(-6);
  const prefix = productName
    .replace(/[^a-zA-Z0-9]/g, '')
    .substring(0, 3)
    .toUpperCase();
  return `${prefix}-${timestamp}`;
};

const generateBarcode = (): string => {
  // Generate a 13-digit EAN-13 compatible barcode
  let barcode = '2' + Math.floor(Math.random() * 100000000000).toString().padStart(11, '0');

  // Calculate check digit
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(barcode[i]) * (i % 2 === 0 ? 1 : 3);
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return barcode + checkDigit;
};

export function AddProductModal({ isOpen, onClose, initialProduct }: AddProductModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [generatedQR, setGeneratedQR] = useState<string>("");
  const [showLabel, setShowLabel] = useState(false);
  const { toast } = useToast();

  const { data: categories } = useQuery<any[]>({
    queryKey: ["/api/categories"],
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: (initialProduct?.name as string) || "",
      sku: (initialProduct?.sku as string) || "",
      categoryId: (initialProduct?.categoryId as string) || "",
      description: (initialProduct?.description as string) || "",
      price: initialProduct?.price ? String(initialProduct.price) : "",
      size: (initialProduct?.size as string) || "",
      stock: initialProduct?.stock != null ? String(initialProduct.stock) : "",
      minStock: initialProduct?.minStock != null ? String(initialProduct.minStock) : "5",
      barcode: (initialProduct?.barcode as string) || "",
    },
  });

  // Auto-generate SKU and barcode when product name changes
  const productName = form.watch("name");
  useEffect(() => {
    if (productName && productName.length > 2) {
      const newSKU = generateSKU(productName);
      const newBarcode = generateBarcode();

      if (!form.getValues("sku")) {
        form.setValue("sku", newSKU);
      }
      if (!form.getValues("barcode")) {
        form.setValue("barcode", newBarcode);
        // Generate 1D barcode preview (EAN-13 or Code128)
        const isEanCandidate = /^\d{12,13}$/.test(newBarcode);
        const symbology = isEanCandidate ? "ean13" : "code128";
        setGeneratedQR(`https://bwipjs-api.metafloor.com/?bcid=${symbology}&text=${encodeURIComponent(newBarcode)}&scale=3&includetext=true&guardwhitespace=true`);
      }
    }
  }, [productName, form]);

  const regenerateCodes = () => {
    const newSKU = generateSKU(productName || "PROD");
    const newBarcode = generateBarcode();
    form.setValue("sku", newSKU);
    form.setValue("barcode", newBarcode);
    const isEanCandidate = /^\d{12,13}$/.test(newBarcode);
    const symbology = isEanCandidate ? "ean13" : "code128";
    setGeneratedQR(`https://bwipjs-api.metafloor.com/?bcid=${symbology}&text=${encodeURIComponent(newBarcode)}&scale=3&includetext=true&guardwhitespace=true`);
  };

  

  const downloadQRCode = () => {
    // Use the unified dialog for proper full-label download
    setShowLabel(true);
  };

  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const productData = {
        ...data,
        price: data.price,
        stock: parseInt(data.stock),
        minStock: data.minStock ? parseInt(data.minStock) : 5,
        categoryId: data.categoryId || null,
      };

      // Try online first
      try {
        const response = initialProduct?.id
          ? await apiRequest("PUT", `/api/products/${initialProduct.id}`, productData)
          : await apiRequest("POST", "/api/products", productData);
        return await response.json();
      } catch (error) {
        // If offline, save to local storage
        if (!navigator.onLine) {
          const offlineProduct = {
            id: (initialProduct?.id as string) || Date.now().toString(),
            ...productData,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          await offlineStorage.addPendingChange("product", offlineProduct);
          return offlineProduct;
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Success",
        description: initialProduct?.id ? "Product updated successfully" : "Product added successfully",
      });
      form.reset();
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      await createMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="modal-add-product">
        <DialogHeader>
          <DialogTitle>{initialProduct?.id ? "Edit Product" : "Add New Product"}</DialogTitle>
          <DialogDescription>
            {initialProduct?.id ? "Update the details for this product." : "Fill in the details below to add a new product to your inventory."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter product name" {...field} data-testid="input-product-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input placeholder="Product SKU" {...field} data-testid="input-product-sku" />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={regenerateCodes}
                        title="Regenerate SKU and Barcode"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <div className="flex gap-2">
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-product-category">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(categories || []).map((category: any) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setShowAddCategory(true)}
                        data-testid="button-add-category"
                        title="Add new category"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="size"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Size</FormLabel>
                    <FormControl>
                      <Input placeholder="S, M, L, XL" {...field} data-testid="input-product-size" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        data-testid="input-product-price"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock Quantity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        data-testid="input-product-stock"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="minStock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Stock Alert</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="5"
                        {...field}
                        data-testid="input-product-min-stock"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="barcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Barcode</FormLabel>
                    <FormControl>
                      <Input placeholder="Product barcode" {...field} data-testid="input-product-barcode" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Product description"
                      {...field}
                      data-testid="textarea-product-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <LabelPreviewDialog
              open={showLabel}
              onOpenChange={setShowLabel}
              product={{
                name: form.getValues("name") || "",
                sku: form.getValues("sku") || "",
                price: form.getValues("price") || "",
                size: form.getValues("size") || "",
                categoryName: (categories || []).find((c: any) => c.id === form.getValues("categoryId"))?.name || "",
                barcode: form.getValues("barcode") || "",
              }}
            />

            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                size="sm"
                onClick={() => setShowLabel(true)}
              >
                Open Advanced
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                data-testid="button-cancel-add-product"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                data-testid="button-submit-add-product"
              >
                {isSubmitting ? (initialProduct?.id ? "Saving..." : "Adding...") : (initialProduct?.id ? "Save Changes" : "Add Product")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>


      <AddCategoryModal
        isOpen={showAddCategory}
        onClose={() => setShowAddCategory(false)}
        onCategoryCreated={(newCategory) => {
          // Set the newly created category as selected
          form.setValue("categoryId", newCategory.id);
        }}
      />
    </Dialog>
  );
}
