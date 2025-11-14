"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { calculateSaleTotals } from "@/lib/sales";
import { useToast } from "./use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { invoicePrinter, type InvoiceData } from "@/lib/printer";
import { Product, SaleItem } from "@shared/schema";
import { favoritesStorage, type FavoriteProduct } from "@/lib/favorites";
import { normalizeItems } from "@/lib/json";

export interface CartItem extends SaleItem {
  id: string;
  stock: number;
}

export function useBilling() {
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
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);

  const { toast } = useToast();
  const { user } = useAuth();

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

  useEffect(() => {
    setFavorites(favoritesStorage.getFavorites());
  }, []);

  const toggleFavorite = (product: Product) => {
    const fav: FavoriteProduct = {
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
      favoritesStorage.addFavorite(fav);
      setFavorites((prev) => [...prev, fav]);
      toast({
        title: "Added to Favorites",
        description: `${product.name} added to favorites`,
      });
    }
  };

  const addToCart = (product: Product, quantity: number = 1) => {
    const existing = cart.find((i) => i.productId === product.id);
    if (existing) {
      const newQty = existing.quantity + quantity;
      if (newQty > product.stock) {
        toast({
          title: "Insufficient Stock",
          description: `Only ${product.stock} units available`,
          variant: "destructive",
        });
        return;
      }
      setCart((prev) =>
        prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: newQty } : i
        )
      );
      return;
    }
    if (quantity > product.stock) {
      toast({
        title: "Insufficient Stock",
        description: `Only ${product.stock} units available`,
        variant: "destructive",
      });
      return;
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
    setCart((prev) => [...prev, newItem]);
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    const current = cart.find((i) => i.productId === productId);
    if (!current) return;
    if (newQuantity > current.stock) {
      toast({
        title: "Insufficient Stock",
        description: `Only ${current.stock} units available`,
        variant: "destructive",
      });
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeFromCart = (productId: string) =>
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  const clearCart = () => {
    setCart([]);
    setCustomerPhone("");
  };

  const handleProductSearch = async ({
    query,
    page,
  }: {
    query: string;
    page: number;
  }) => {
    if (!query.trim()) {
      return { results: [], hasMore: false };
    }

    // Filter from your products (local DB cache)
    const pageSize = 20;

    const filtered = products.filter(
      (p) =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.sku?.toLowerCase().includes(query.toLowerCase())
    );

    // Pagination
    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    return {
      results: filtered.slice(start, end),
      hasMore: end < filtered.length,
    };
  };

  const handleScan = (barcode: string) => {
    const product = products.find((p: Product) => p.barcode === barcode);
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
    const product = products.find((p) => p.id === productId);
    if (!product) return basePrice;
    const applicable = (promoTargets as any[])
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
        return matches ? promo : null;
      })
      .filter(Boolean) as any[];
    if (applicable.length === 0) return basePrice;
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
    // Calculate subtotal with any product-specific discounts
    const cartWithDiscounts = cart.map((item) => ({
      ...item,
      price: getDiscountedUnitPrice(item.productId, parseFloat(item.price)),
    }));

    // Use shared calculation function
    const calculation = calculateSaleTotals(
      cartWithDiscounts,
      appliedCoupon ? "percentage" : null,
      appliedCoupon ? parseFloat(appliedCoupon.percentage) : 0
    );

    return {
      subtotal: calculation.subtotal,
      couponDiscount: calculation.discountAmount,
      afterCoupon: calculation.subtotal - calculation.discountAmount,
      tax: 0, // GST removed
      total: calculation.total,
      taxPercent: 0, // GST removed
    };
  };

  const createSaleMutation = useMutation({
    mutationFn: async (saleData: any) => {
      try {
        const response = await apiRequest("POST", "/api/sales", saleData);
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to create sale");
        }
        return await response.json();
      } catch (err: any) {
        throw new Error(err.message || "Failed to create sale");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Sale Failed",
        description: error.message || "Failed to create sale",
        variant: "destructive",
      });
    },
  });

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to cart before checkout",
        variant: "destructive",
      });
      return;
    }
    // Use defaults if not provided
    const finalCustomerName = customerName.trim() || "Walk-in Customer";
    const finalCustomerPhone = customerPhone.trim() || "0000000000";
    setIsProcessing(true);
    try {
      const calculation = calculateSaleTotals(
        cart.map((item) => ({
          ...item,
          price: getDiscountedUnitPrice(item.productId, parseFloat(item.price)),
        })),
        appliedCoupon ? "percentage" : null,
        appliedCoupon ? parseFloat(appliedCoupon.percentage) : 0
      );

      const saleData = {
        user_id: user!.id,
        customer_name: finalCustomerName,
        customer_phone: finalCustomerPhone,
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
        subtotal: calculation.subtotal.toFixed(2),
        tax_percent: calculation.taxPercent.toFixed(2),
        tax_amount: calculation.taxAmount.toFixed(2),
        discount_type: calculation.discountType,
        discount_value: calculation.discountValue.toFixed(2),
        discount_amount: calculation.discountAmount.toFixed(2),
        total_amount: calculation.total.toFixed(2),
        payment_method: paymentMethod,
        invoice_number: `INV-${Date.now()}`,
      } as any;
      const sale = await createSaleMutation.mutateAsync(saleData);
      // Round all values
      const invoiceData: InvoiceData = {
        invoiceNumber:
          sale.invoiceNumber || sale.invoice_number || `INV-${Date.now()}`,
        date: new Date(),
        customerName: finalCustomerName,
        customerPhone: finalCustomerPhone,
        items: cart.map((item) => {
          const price =
            Math.round(
              getDiscountedUnitPrice(item.productId, parseFloat(item.price)) *
                100
            ) / 100;
          return {
            name: item.name,
            quantity: item.quantity,
            price: price,
            total: Math.round(price * item.quantity * 100) / 100,
          };
        }),
        subtotal: Math.round(calculation.subtotal * 100) / 100,
        tax: Math.round(calculation.taxAmount * 100) / 100,
        taxPercent: calculation.taxPercent,
        discountType: calculation.discountType || undefined,
        discountValue: Math.round(calculation.discountValue * 100) / 100,
        discountAmount: Math.round(calculation.discountAmount * 100) / 100,
        total: Math.round(calculation.total * 100) / 100,
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

  const addRecentSaleToCart = (sale: any) => {
    const items = normalizeItems(sale.items);
    if (Array.isArray(items)) {
      for (const it of items) {
        const product = products.find((p) => p.id === it.productId);
        if (product) addToCart(product, it.quantity);
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
    const coupon = (coupons as any[]).find(
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
    toast({ title: "Coupon Removed", description: "Discount coupon removed" });
  };

  return {
    // state
    cart,
    productCode,
    searchResults,
    showScanner,
    paymentMethod,
    showConfirmPayment,
    showThankYou,
    lastInvoiceData,
    lastCustomerPhone,
    customerPhone,
    customerName,
    isProcessing,
    favorites,
    couponCode,
    appliedCoupon,
    // setters
    setProductCode,
    setShowScanner,
    setPaymentMethod,
    setShowConfirmPayment,
    setShowThankYou,
    setCustomerPhone,
    setCustomerName,
    setCouponCode,
    // data
    products,
    recentSales,
    mostSoldProducts,
    // actions
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    toggleFavorite,
    handleProductSearch,
    handleScan,
    calculateTotals,
    handleCheckout,
    addRecentSaleToCart,
    addMostSoldToCart,
    applyCoupon,
    removeCoupon,
    isFavorite: (id: string) => favoritesStorage.isFavorite(id),
  };
}
