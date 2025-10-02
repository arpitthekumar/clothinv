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
import { insertProductSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { offlineStorage } from "@/lib/offline-storage";
import { AddCategoryModal } from "@/components/shared/add-category-modal";
import { Plus, RefreshCw, QrCode, Printer, Download } from "lucide-react";
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

export function AddProductModal({ isOpen, onClose }: AddProductModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [generatedQR, setGeneratedQR] = useState<string>("");
  const { toast } = useToast();

  const { data: categories } = useQuery<any[]>({
    queryKey: ["/api/categories"],
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      sku: "",
      categoryId: "",
      description: "",
      price: "",
      size: "",
      stock: "",
      minStock: "5",
      barcode: "",
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
        // Generate QR code data URL
        setGeneratedQR(`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${newBarcode}`);
      }
    }
  }, [productName, form]);

  const regenerateCodes = () => {
    const newSKU = generateSKU(productName || "PROD");
    const newBarcode = generateBarcode();
    form.setValue("sku", newSKU);
    form.setValue("barcode", newBarcode);
    setGeneratedQR(`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${newBarcode}`);
  };

  const printProductLabel = () => {
    const formData = form.getValues();
    if (!formData.name || !formData.barcode) {
      toast({
        title: "Error",
        description: "Please fill in product name and barcode before printing",
        variant: "destructive",
      });
      return;
    }

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Product Label - ${formData.name}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .label { border: 2px solid #000; padding: 20px; width: 300px; text-align: center; }
              .product-name { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
              .sku { font-size: 14px; margin-bottom: 5px; }
              .price { font-size: 16px; font-weight: bold; color: #2563eb; margin-bottom: 10px; }
              .qr-code { margin: 10px 0; }
              .barcode { font-family: monospace; font-size: 12px; letter-spacing: 2px; }
            </style>
          </head>
          <body>
            <div class="label">
              <div class="product-name">${formData.name}</div>
              <div class="sku">SKU: ${formData.sku}</div>
              <div class="price">₹${formData.price}</div>
              <div class="qr-code">
                <img src="${generatedQR}" alt="QR Code" />
              </div>
              <div class="barcode">${formData.barcode}</div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const downloadQRCode = () => {
    if (!generatedQR) {
      toast({
        title: "Error",
        description: "No QR code generated yet",
        variant: "destructive",
      });
      return;
    }

    const link = document.createElement('a');
    link.href = generatedQR;
    link.download = `qr-code-${form.getValues("sku") || "product"}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        const response = await apiRequest("POST", "/api/products", productData);
        return await response.json();
      } catch (error) {
        // If offline, save to local storage
        if (!navigator.onLine) {
          const offlineProduct = {
            id: Date.now().toString(),
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
        description: "Product added successfully",
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
          <DialogTitle>Add New Product</DialogTitle>
          <DialogDescription>
            Fill in the details below to add a new product to your inventory.
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

             {/* QR Code Preview and Print Section */}
             {generatedQR && (
               <div className="border rounded-lg p-4 bg-gray-50">
                 <div className="flex items-center justify-between mb-3">
                   <h3 className="text-sm font-medium flex items-center gap-2">
                     <QrCode className="h-4 w-4" />
                     Product Label Preview
                   </h3>
                   <div className="flex gap-2">
                     <Button
                       type="button"
                       variant="outline"
                       size="sm"
                       onClick={downloadQRCode}
                       className="flex items-center gap-2"
                     >
                       <Download className="h-4 w-4" />
                       Download
                     </Button>
                     <Button
                       type="button"
                       variant="outline"
                       size="sm"
                       onClick={printProductLabel}
                       className="flex items-center gap-2"
                     >
                       <Printer className="h-4 w-4" />
                       Print Label
                     </Button>
                   </div>
                 </div>
                 <div className="flex items-center gap-4">
                   <div className="bg-white p-2 rounded border">
                     <img src={generatedQR} alt="Product QR Code" className="w-16 h-16" />
                   </div>
                   <div className="text-sm text-gray-600">
                     <p>Barcode: {form.getValues("barcode")}</p>
                     <p>SKU: {form.getValues("sku")}</p>
                   </div>
                 </div>
               </div>
             )}

            <div className="flex justify-end space-x-3">
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
                {isSubmitting ? "Adding..." : "Add Product"}
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
