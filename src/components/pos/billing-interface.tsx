import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScannerModal } from "@/components/shared/scanner-modal";
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  QrCode, 
  CreditCard, 
  Printer, 
  MessageCircle,
  Search
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { offlineStorage } from "@/lib/offline-storage";
import { invoicePrinter, InvoiceData } from "@/lib/printer";
import { Product, SaleItem } from "@shared/schema";

interface CartItem extends SaleItem {
  id: string;
  stock: number;
}

export function BillingInterface() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [productCode, setProductCode] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [customerPhone, setCustomerPhone] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const createSaleMutation = useMutation({
    mutationFn: async (saleData: any) => {
      try {
        const response = await apiRequest("POST", "/api/sales", saleData);
        return await response.json();
      } catch (error) {
        // If offline, save to local storage
        if (!navigator.onLine) {
          const offlineSale = {
            id: Date.now().toString(),
            ...saleData,
            createdAt: new Date(),
          };
          
          await offlineStorage.saveSale(offlineSale);
          await offlineStorage.addPendingChange("sale", offlineSale);
          return offlineSale;
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
  });

  const addToCart = (product: Product, quantity: number = 1) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.productId === product.id);
      
      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity > product.stock) {
          toast({
            title: "Insufficient Stock",
            description: `Only ${product.stock} units available`,
            variant: "destructive",
          });
          return prevCart;
        }
        
        return prevCart.map(item =>
          item.productId === product.id
            ? { ...item, quantity: newQuantity }
            : item
        );
      }
      
      if (quantity > product.stock) {
        toast({
          title: "Insufficient Stock",
          description: `Only ${product.stock} units available`,
          variant: "destructive",
        });
        return prevCart;
      }
      
      const newItem: CartItem = {
        id: product.id,
        productId: product.id,
        name: product.name,
        sku: product.sku,
        quantity,
        price: product.price,
        stock: product.stock,
      };
      
      return [...prevCart, newItem];
    });
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.productId === productId) {
          if (newQuantity > item.stock) {
            toast({
              title: "Insufficient Stock",
              description: `Only ${item.stock} units available`,
              variant: "destructive",
            });
            return item;
          }
          return { ...item, quantity: newQuantity };
        }
        return item;
      });
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.productId !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setCustomerPhone("");
  };

  const handleProductSearch = () => {
    if (!productCode.trim()) return;
    
    const product = products?.find((p: Product) => 
      p.sku.toLowerCase() === productCode.toLowerCase() || 
      p.barcode === productCode ||
      p.name.toLowerCase().includes(productCode.toLowerCase())
    );
    
    if (product) {
      addToCart(product);
      setProductCode("");
      toast({
        title: "Product Added",
        description: `${product.name} added to cart`,
      });
    } else {
      toast({
        title: "Product Not Found",
        description: "No product found with that code",
        variant: "destructive",
      });
    }
  };

  const handleScan = (barcode: string) => {
    const product = products?.find((p: Product) => p.barcode === barcode);
    
    if (product) {
      addToCart(product);
      toast({
        title: "Product Scanned",
        description: `${product.name} added to cart`,
      });
    } else {
      toast({
        title: "Product Not Found",
        description: "No product found with that barcode",
        variant: "destructive",
      });
    }
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
    const tax = subtotal * 0.18; // 18% GST
    const total = subtotal + tax;
    
    return { subtotal, tax, total };
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to cart before checkout",
        variant: "destructive",
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const { subtotal, tax, total } = calculateTotals();
      
      const saleData = {
        userId: user!.id,
        items: JSON.stringify(cart.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          name: item.name,
          sku: item.sku,
        }))),
        totalAmount: total.toFixed(2),
        paymentMethod,
      };
      
      const sale = await createSaleMutation.mutateAsync(saleData);
      
      // Generate invoice
      const invoiceData: InvoiceData = {
        invoiceNumber: sale.invoiceNumber || `INV-${Date.now()}`,
        date: new Date(),
        items: cart.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: parseFloat(item.price),
          total: parseFloat(item.price) * item.quantity,
        })),
        subtotal,
        tax,
        total,
        paymentMethod,
      };
      
      // Print invoice
      await invoicePrinter.printInvoice(invoiceData);
      
      // Share via WhatsApp if phone number provided
      if (customerPhone) {
        await invoicePrinter.shareViaWhatsApp(invoiceData, customerPhone);
      }
      
      toast({
        title: "Sale Completed",
        description: `Invoice ${invoiceData.invoiceNumber} generated successfully`,
      });
      
      clearCart();
      
    } catch (error) {
      toast({
        title: "Checkout Failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const { subtotal, tax, total } = calculateTotals();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Product Search & Cart */}
      <div className="lg:col-span-2 space-y-6">
        {/* Product Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="mr-2 h-5 w-5" />
              Product Search
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search by name, SKU, or barcode"
                value={productCode}
                onChange={(e) => setProductCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleProductSearch()}
                className="flex-1"
                data-testid="input-product-search"
              />
              <Button onClick={handleProductSearch} data-testid="button-search-product">
                <Search className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowScanner(true)}
                data-testid="button-open-scanner"
              >
                <QrCode className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Shopping Cart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <ShoppingCart className="mr-2 h-5 w-5" />
                Shopping Cart ({cart.length} items)
              </span>
              {cart.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearCart}
                  data-testid="button-clear-cart"
                >
                  Clear All
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cart.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Cart is empty</p>
                <p className="text-sm text-muted-foreground">Scan or search for products to add them</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center justify-between border-b pb-4">
                    <div className="flex-1">
                      <h4 className="font-medium" data-testid={`cart-item-name-${item.id}`}>
                        {item.name}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        SKU: {item.sku} • ₹{item.price}
                      </p>
                      <Badge variant="outline" className="mt-1">
                        {item.stock} in stock
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        data-testid={`button-decrease-${item.id}`}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      
                      <span className="w-12 text-center font-medium" data-testid={`quantity-${item.id}`}>
                        {item.quantity}
                      </span>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        data-testid={`button-increase-${item.id}`}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeFromCart(item.productId)}
                        data-testid={`button-remove-${item.id}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div className="text-right ml-4">
                      <p className="font-medium" data-testid={`item-total-${item.id}`}>
                        ₹{(parseFloat(item.price) * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Checkout Panel */}
      <div className="space-y-6">
        {/* Bill Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Bill Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span data-testid="text-subtotal">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>GST (18%):</span>
                <span data-testid="text-tax">₹{tax.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span data-testid="text-total">₹{total.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Details */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Payment Method</label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger data-testid="select-payment-method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Credit/Debit Card</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="netbanking">Net Banking</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Customer Phone (Optional)</label>
              <Input
                placeholder="WhatsApp number for receipt"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                data-testid="input-customer-phone"
              />
            </div>

            <Button 
              onClick={handleCheckout} 
              className="w-full" 
              disabled={cart.length === 0 || isProcessing}
              data-testid="button-checkout"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              {isProcessing ? "Processing..." : `Pay ₹${total.toFixed(2)}`}
            </Button>

            {cart.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" data-testid="button-print-receipt">
                  <Printer className="mr-2 h-3 w-3" />
                  Print
                </Button>
                <Button variant="outline" size="sm" data-testid="button-share-whatsapp">
                  <MessageCircle className="mr-2 h-3 w-3" />
                  WhatsApp
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Scanner Modal */}
      <ScannerModal
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleScan}
      />
    </div>
  );
}
