import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Search,
  Heart,
  Clock,
  TrendingUp,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { offlineStorage } from "@/lib/offline-storage";
import { invoicePrinter, InvoiceData } from "@/lib/printer";
import { Product, SaleItem } from "@shared/schema";
import { favoritesStorage, FavoriteProduct } from "@/lib/favorites";

interface CartItem extends SaleItem {
  id: string;
  stock: number;
}

export function BillingInterface() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [productCode, setProductCode] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [showConfirmPayment, setShowConfirmPayment] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [lastInvoiceData, setLastInvoiceData] = useState<InvoiceData | null>(
    null
  );
  const [lastCustomerPhone, setLastCustomerPhone] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [returnMode, setReturnMode] = useState(false);
  const [linkedSaleId, setLinkedSaleId] = useState<string>("");
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);

  const { toast } = useToast();
  const { user } = useAuth();

  // Clear search results when query is cleared
  useEffect(() => {
    if (!productCode.trim()) setSearchResults([]);
  }, [productCode]);

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });
  const { data: promotions = [] } = useQuery<any[]>({
    queryKey: ["/api/promotions"],
  });
  const { data: promoTargets = [] } = useQuery<any[]>({
    queryKey: ["/api/promotions/targets"],
  });
  const { data: recentSales = [] } = useQuery<any[]>({
    queryKey: ["/api/sales/recent"],
  });
  const { data: mostSoldProducts = [] } = useQuery<any[]>({
    queryKey: ["/api/products/most-sold"],
  });
  const { data: coupons = [] } = useQuery<any[]>({
    queryKey: ["/api/coupons"],
  });

  // Load favorites on component mount
  useEffect(() => {
    setFavorites(favoritesStorage.getFavorites());
  }, []);

  const toggleFavorite = (product: Product) => {
    const favoriteProduct: FavoriteProduct = {
      id: product.id,
      name: product.name,
      sku: product.sku,
      price: product.price,
      stock: product.stock,
    };

    if (favoritesStorage.isFavorite(product.id)) {
      favoritesStorage.removeFavorite(product.id);
      setFavorites((prev) => prev.filter((f) => f.id !== product.id));
      toast({
        title: "Removed from Favorites",
        description: `${product.name} removed from favorites`,
      });
    } else {
      favoritesStorage.addFavorite(favoriteProduct);
      setFavorites((prev) => [...prev, favoriteProduct]);
      toast({
        title: "Added to Favorites",
        description: `${product.name} added to favorites`,
      });
    }
  };

  const addFavoriteToCart = (favorite: FavoriteProduct) => {
    const product = products.find((p) => p.id === favorite.id);
    if (product) {
      addToCart(product);
    }
  };

  const addRecentSaleToCart = (sale: any) => {
    const items =
      typeof sale.items === "string" ? JSON.parse(sale.items) : sale.items;
    if (Array.isArray(items)) {
      for (const item of items) {
        const product = products.find((p) => p.id === item.productId);
        if (product) {
          addToCart(product, item.quantity);
        }
      }
      toast({
        title: "Sale Items Added",
        description: `Items from sale ${sale.invoiceNumber} added to cart`,
      });
    }
  };

  const addMostSoldToCart = (mostSold: any) => {
    const product = products.find((p) => p.id === mostSold.productId);
    if (product) {
      if (product.stock <= 0) {
        toast({
          title: "Out of Stock",
          description: `${product.name} is currently out of stock`,
          variant: "destructive",
        });
        return;
      }
      addToCart(product);
    }
  };

  const applyCoupon = () => {
    if (!couponCode.trim()) return;

    const coupon = coupons.find(
      (c) => c.name.toLowerCase() === couponCode.toLowerCase()
    );
    if (coupon) {
      setAppliedCoupon(coupon);
      toast({
        title: "Coupon Applied",
        description: `${coupon.percentage}% discount applied`,
      });
    } else {
      toast({
        title: "Invalid Coupon",
        description: "Coupon code not found",
        variant: "destructive",
      });
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    toast({
      title: "Coupon Removed",
      description: "Discount coupon removed",
    });
  };

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
    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (item) => item.productId === product.id
      );

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

        return prevCart.map((item) =>
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

    setCart((prevCart) => {
      return prevCart.map((item) => {
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
    setCart((prevCart) =>
      prevCart.filter((item) => item.productId !== productId)
    );
  };

  const clearCart = () => {
    setCart([]);
    setCustomerPhone("");
  };

  const handleProductSearch = () => {
    if (!productCode.trim()) {
      setSearchResults([]);
      return;
    }
    const query = productCode.toLowerCase();
    const results = products.filter(
      (p: Product) =>
        p.sku.toLowerCase() === query ||
        p.barcode === productCode ||
        p.name.toLowerCase().includes(query)
    );
    setSearchResults(results);
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

  const getDiscountedUnitPrice = (productId: string, basePrice: number) => {
    // Find matching promotions by product or category
    const product = products.find((p) => p.id === productId);
    if (!product) return basePrice;
    const applicable = promoTargets
      .map((t: any) => {
        const promo = promotions.find(
          (p: any) => p.id === t.promotionId || p.id === t.promotion_id
        );
        if (!promo || promo.active === false) return null;
        const now = Date.now();
        const starts = promo.startsAt || promo.starts_at;
        const ends = promo.endsAt || promo.ends_at;
        if (starts && new Date(starts).getTime() > now) return null;
        if (ends && new Date(ends).getTime() < now) return null;
        const targetType = t.targetType || t.target_type;
        const targetId = t.targetId || t.target_id;
        const matches =
          targetType === "product"
            ? targetId === productId
            : targetId === product.categoryId;
        if (!matches) return null;
        return promo;
      })
      .filter(Boolean) as any[];
    if (applicable.length === 0) return basePrice;
    // Apply the best discount
    let best = basePrice;
    for (const promo of applicable) {
      const type = promo.type;
      const value = parseFloat(promo.value);
      let price = basePrice;
      if (type === "percent") price = basePrice * (1 - value / 100);
      if (type === "fixed") price = Math.max(0, basePrice - value);
      if (price < best) best = price;
    }
    return best;
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => {
      const unit = parseFloat(item.price);
      const discounted = getDiscountedUnitPrice(item.productId, unit);
      return sum + discounted * item.quantity;
    }, 0);

    // Apply coupon discount if any
    let couponDiscount = 0;
    if (appliedCoupon) {
      couponDiscount = subtotal * (parseFloat(appliedCoupon.percentage) / 100);
    }

    const afterCoupon = subtotal - couponDiscount;
    const tax = afterCoupon * 0.18; // 18% GST
    const total = afterCoupon + tax;

    return { subtotal, couponDiscount, afterCoupon, tax, total };
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
    if (!customerName.trim() || !customerPhone.trim()) {
      toast({
        title: "Customer details required",
        description: "Enter customer name and phone number",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const { subtotal, couponDiscount, afterCoupon, tax, total } =
        calculateTotals();

      const saleData = {
        userId: user!.id,
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: getDiscountedUnitPrice(
            item.productId,
            parseFloat(item.price)
          ).toFixed(2),
          name: item.name,
          sku: item.sku,
        })),
        totalAmount: total.toFixed(2),
        paymentMethod,
      } as any;

      const sale = await createSaleMutation.mutateAsync(saleData);

      // Prepare invoice data but don't auto-print. We'll print after confirmation.
      const invoiceData: InvoiceData = {
        invoiceNumber: sale.invoiceNumber || `INV-${Date.now()}`,
        date: new Date(),
        items: cart.map((item) => ({
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
      setLastInvoiceData(invoiceData);
      setLastCustomerPhone(customerPhone);
      setShowConfirmPayment(true);
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

  const totals = calculateTotals();
  const { subtotal, couponDiscount, tax, total } = totals;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
      {/* Product Search & Cart */}
      <div className="xl:col-span-2 space-y-4 md:space-y-6">
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
              <Button
                onClick={handleProductSearch}
                className="px-3 md:px-4"
                data-testid="button-search-product"
              >
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
            {searchResults.length > 0 && (
              <div className="space-y-2 max-h-52 overflow-y-auto border rounded p-2">
                {searchResults.map((p) => {
                  const isFav = favoritesStorage.isFavorite(p.id);
                  const out = p.stock <= 0;
                  return (
                    <div
                      key={p.id}
                      className={`flex items-center justify-between p-2 rounded ${
                        out ? "opacity-60" : ""
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground">
                          SKU: {p.sku} • ₹{p.price} • Stock: {p.stock}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleFavorite(p)}
                          className={isFav ? "text-red-500" : ""}
                        >
                          <Heart
                            className={`h-3 w-3 ${isFav ? "fill-current" : ""}`}
                          />
                        </Button>
                        <Button
                          size="sm"
                          disabled={out}
                          onClick={() => addToCart(p)}
                        >
                          <Plus className="h-3 w-3 mr-1" /> Add
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Return Mode</label>
              <Button
                variant={returnMode ? "default" : "outline"}
                size="sm"
                onClick={() => setReturnMode(!returnMode)}
              >
                {returnMode ? "On" : "Off"}
              </Button>
              {returnMode && (
                <Input
                  placeholder="Link Sale ID (optional)"
                  value={linkedSaleId}
                  onChange={(e) => setLinkedSaleId(e.target.value)}
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Access Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Favorites */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-sm">
                <Heart className="mr-2 h-4 w-4" />
                Favorites ({favorites.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {favorites.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No favorites yet. Add products to favorites for quick access.
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {favorites.map((favorite) => (
                    <div
                      key={favorite.id}
                      className="flex items-center justify-between p-2 border rounded"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {favorite.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ₹{favorite.price}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addFavoriteToCart(favorite)}
                        className="ml-2"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Sales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-sm">
                <Clock className="mr-2 h-4 w-4" />
                Recent Sales
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentSales.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recent sales found.
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {recentSales.slice(0, 5).map((sale) => (
                    <div
                      key={sale.id}
                      className="flex items-center justify-between p-2 border rounded"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {sale.invoiceNumber}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ₹{sale.totalAmount}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addRecentSaleToCart(sale)}
                        className="ml-2"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Most Sold */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-sm">
                <TrendingUp className="mr-2 h-4 w-4" />
                Most Sold
              </CardTitle>
            </CardHeader>
            <CardContent>
              {mostSoldProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No sales data available.
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {mostSoldProducts.slice(0, 5).map((product) => {
                    const productData = products.find(
                      (p) => p.id === product.productId
                    );
                    const isOutOfStock = !productData || productData.stock <= 0;

                    return (
                      <div
                        key={product.productId}
                        className={`flex items-center justify-between p-2 border rounded ${
                          isOutOfStock ? "opacity-50 bg-muted" : ""
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-medium truncate ${
                              isOutOfStock ? "text-muted-foreground" : ""
                            }`}
                          >
                            {product.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {product.totalSold} sold • ₹{product.price}
                            {isOutOfStock && (
                              <span className="text-red-500 ml-2">
                                • Out of Stock
                              </span>
                            )}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addMostSoldToCart(product)}
                          className="ml-2"
                          disabled={isOutOfStock}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

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
                <p className="text-sm text-muted-foreground">
                  Scan or search for products to add them
                </p>
              </div>
            ) : (
              <div className="space-y-3 md:space-y-4">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 border-b pb-3 md:pb-4"
                  >
                    <div className="flex-1">
                      <h4
                        className="font-medium"
                        data-testid={`cart-item-name-${item.id}`}
                      >
                        {item.name}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        SKU: {item.sku} • ₹{item.price}
                      </p>
                      <Badge variant="outline" className="mt-1">
                        {item.stock} in stock
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity - 1)
                        }
                        data-testid={`button-decrease-${item.id}`}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>

                      <span
                        className="w-10 md:w-12 text-center font-medium"
                        data-testid={`quantity-${item.id}`}
                      >
                        {item.quantity}
                      </span>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity + 1)
                        }
                        data-testid={`button-increase-${item.id}`}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          toggleFavorite(
                            products.find((p) => p.id === item.productId)!
                          )
                        }
                        data-testid={`button-favorite-${item.id}`}
                        className={
                          favoritesStorage.isFavorite(item.productId)
                            ? "text-red-500"
                            : ""
                        }
                      >
                        <Heart
                          className={`h-3 w-3 ${
                            favoritesStorage.isFavorite(item.productId)
                              ? "fill-current"
                              : ""
                          }`}
                        />
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

                    <div className="text-right ml-2 md:ml-4 min-w-[84px]">
                      <p
                        className="font-medium"
                        data-testid={`item-total-${item.id}`}
                      >
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
              {appliedCoupon && (
                <div className="flex justify-between text-green-600">
                  <span>Coupon Discount ({appliedCoupon.percentage}%):</span>
                  <span>-₹{couponDiscount.toFixed(2)}</span>
                </div>
              )}
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
              <label className="text-sm font-medium mb-2 block">
                Payment Method
              </label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger data-testid="select-payment-method">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Customer Name
              </label>
              <Input
                placeholder="Full name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                data-testid="input-customer-name"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Customer Phone
              </label>
              <div className="flex items-center border rounded-md overflow-hidden">
                <span className="px-3 text-gray-600 bg-gray-100 border-r">
                  +91
                </span>
                <Input
                  type="tel"
                  placeholder="WhatsApp number for receipt"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  data-testid="input-customer-phone"
                  className="border-0 focus:ring-0 focus:outline-none flex-1"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Coupon Code
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  disabled={!!appliedCoupon}
                />
                {appliedCoupon ? (
                  <Button variant="outline" onClick={removeCoupon}>
                    Remove
                  </Button>
                ) : (
                  <Button variant="outline" onClick={applyCoupon}>
                    Apply
                  </Button>
                )}
              </div>
              {appliedCoupon && (
                <p className="text-sm text-green-600 mt-1">
                  {appliedCoupon.percentage}% discount applied
                </p>
              )}
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

            
          </CardContent>
        </Card>
      </div>

      {/* Scanner Modal */}
      <ScannerModal
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleScan}
      />

      {/* Confirm Payment Dialog */}
      <Dialog open={showConfirmPayment} onOpenChange={setShowConfirmPayment}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Payment</DialogTitle>
          </DialogHeader>
          <p>
            Please confirm the payment of ₹{total.toFixed(2)} via{" "}
            {paymentMethod.toUpperCase()} is completed.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmPayment(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowConfirmPayment(false);
                setShowThankYou(true);
                clearCart();
                setCustomerName("");
                setCustomerPhone("");
              }}
            >
              Payment Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Thank You Dialog */}
      <Dialog open={showThankYou} onOpenChange={setShowThankYou}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thank you for your purchase!</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p>Payment recorded. You can now print the bill or share it.</p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={async () => {
                  if (lastInvoiceData) {
                    await invoicePrinter.printInvoice(lastInvoiceData);
                  }
                }}
              >
                <Printer className="mr-2 h-4 w-4" /> Print Bill
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  if (lastInvoiceData && lastCustomerPhone) {
                    // ensure it always has +91 prefix, even if user doesn’t type it
                    const phoneNumber = lastCustomerPhone.startsWith("+91")
                      ? lastCustomerPhone
                      : `+91${lastCustomerPhone}`;

                    await invoicePrinter.shareViaWhatsApp(
                      lastInvoiceData,
                      phoneNumber
                    );
                  }
                }}
              >
                Share via WhatsApp
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
