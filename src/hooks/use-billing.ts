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
import { getPosCheckoutPrefs } from "@/lib/pos-checkout-prefs";
import { useStoreSettings } from "@/hooks/use-store-settings";

export interface CartItem extends SaleItem {
  id: string;
  stock: number;
  isBargainable?: boolean;
  minPrice?: string | number | null;
  buyingPrice?: string | number | null;
  customUnitPrice?: number | null;
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
    null,
  );
  const [lastCustomerPhone, setLastCustomerPhone] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [salespersonId, setSalespersonId] = useState<string>("");
  const [salespersonName, setSalespersonName] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConfirmingSale, setIsConfirmingSale] = useState(false);
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [customDiscountType, setCustomDiscountType] = useState<"none" | "coupon" | "custom_flat" | "custom_percent">("none");
  const [customDiscountValue, setCustomDiscountValue] = useState<string>("");

  const { toast } = useToast();
  const { user } = useAuth();
  const { settings: storeSettings } = useStoreSettings();

  const [matchedCustomerName, setMatchedCustomerName] = useState<string | null>(null);

  useEffect(() => {
    if (!productCode.trim()) setSearchResults([]);
  }, [productCode]);

  useEffect(() => {
    const cleanDigits = customerPhone.replace(/\D/g, "");
    if (cleanDigits.length === 10 && cleanDigits !== "0000000000") {
      const controller = new AbortController();
      const timer = setTimeout(async () => {
        try {
          const res = await fetch(`/api/customers/lookup?phone=${encodeURIComponent(cleanDigits)}`, {
            signal: controller.signal,
          });
          if (res.ok) {
            const data = await res.json();
            if (data.customer?.name) {
              setCustomerName(data.customer.name);
              setMatchedCustomerName(data.customer.name);
              toast({
                title: "Existing Customer Matched",
                description: `Phone matched saved customer "${data.customer.name}". Name auto-filled.`,
              });
            } else {
              setMatchedCustomerName(null);
            }
          }
        } catch (e: any) {
          if (e.name !== "AbortError") {
            // ignore network/abort errors
          }
        }
      }, 350);
      return () => {
        clearTimeout(timer);
        controller.abort();
      };
    } else {
      setMatchedCustomerName(null);
    }
  }, [customerPhone]);

  const { data: salespersons = [] } = useQuery<any[]>({
    queryKey: ["/api/salespersons"],
  });
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

  const applyDefaultDiscount = useCallback(() => {
    const prefs = getPosCheckoutPrefs();
    if (prefs.defaultDiscountEnabled && prefs.defaultDiscountValue) {
      if (prefs.defaultDiscountType === "percentage") {
        setCustomDiscountType("custom_percent");
        setCustomDiscountValue(prefs.defaultDiscountValue);
        setCouponCode("");
        setAppliedCoupon(null);
      } else if (prefs.defaultDiscountType === "fixed") {
        setCustomDiscountType("custom_flat");
        setCustomDiscountValue(prefs.defaultDiscountValue);
        setCouponCode("");
        setAppliedCoupon(null);
      } else if (prefs.defaultDiscountType === "coupon") {
        setCustomDiscountType("coupon");
        setCouponCode(prefs.defaultDiscountValue);
        setCustomDiscountValue("");
      }
    }
  }, []);

  useEffect(() => {
    applyDefaultDiscount();
  }, [applyDefaultDiscount]);

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
          i.productId === product.id ? { ...i, quantity: newQty } : i,
        ),
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
      isBargainable: (product as any).isBargainable ?? false,
      minPrice: (product as any).minPrice ?? (product as any).min_price ?? null,
      buyingPrice: (product as any).buyingPrice ?? (product as any).buying_price ?? null,
      customUnitPrice: null,
    };
    setCart((prev) => [...prev, newItem]);
  };

  const updateItemPrice = (productId: string, customPrice: number | null) => {
    setCart((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? { ...item, customUnitPrice: customPrice }
          : item
      )
    );
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
        item.productId === productId
          ? { ...item, quantity: newQuantity }
          : item,
      ),
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
        p.sku?.toLowerCase().includes(query.toLowerCase()),
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
    if (!product) return Math.round(basePrice);
    const applicable = (promoTargets as any[])
      .map((t: any) => {
        const promo = promotions.find(
          (p: any) => p.id === t.promotionId || p.id === t.promotion_id,
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
    if (applicable.length === 0) return Math.round(basePrice);
    let best = basePrice;
    for (const promo of applicable) {
      const type = promo.type;
      const value = parseFloat(promo.value);
      let price = basePrice;
      if (type === "percent") price = basePrice * (1 - value / 100);
      if (type === "fixed") price = Math.max(0, basePrice - value);
      if (price < best) best = price;
    }
    return Math.round(best);
  };
  const getFinalUnitPrice = (
    productId: string,
    basePrice: number,
    quantity: number,
    subtotal: number,
    couponDiscount: number,
  ) => {
    const productPrice = getDiscountedUnitPrice(productId, basePrice);

    if (!couponDiscount || subtotal <= 0) {
      return productPrice;
    }

    const itemTotal = productPrice * quantity;
    const ratio = itemTotal / subtotal;

    const itemCouponShare = couponDiscount * ratio;
    const couponPerUnit = itemCouponShare / quantity;

    return Math.max(0, Math.round(productPrice - couponPerUnit));
  };
  const getEffectiveDiscount = () => {
    if (customDiscountType === "coupon" && appliedCoupon) {
      return {
        type: "percentage" as const,
        value: parseFloat(appliedCoupon.percentage || "0"),
      };
    }
    if (customDiscountType === "custom_flat" && customDiscountValue) {
      return {
        type: "fixed" as const,
        value: parseFloat(customDiscountValue || "0"),
      };
    }
    if (customDiscountType === "custom_percent" && customDiscountValue) {
      return {
        type: "percentage" as const,
        value: parseFloat(customDiscountValue || "0"),
      };
    }
    return { type: null, value: 0 };
  };

  const getItemEffectivePrice = (item: CartItem) => {
    const base = item.customUnitPrice ?? parseFloat(item.price);
    return Math.round(getDiscountedUnitPrice(item.productId, base));
  };

  const calculateTotals = () => {
    let listSubtotal = 0;
    let afterPromoSubtotal = 0;
    for (const item of cart) {
      const base = item.customUnitPrice ?? parseFloat(item.price);
      const unitPromo = getDiscountedUnitPrice(item.productId, base);
      listSubtotal += Math.round(parseFloat(item.price)) * item.quantity;
      afterPromoSubtotal += unitPromo * item.quantity;
    }
    listSubtotal = Math.round(listSubtotal);
    afterPromoSubtotal = Math.round(afterPromoSubtotal);
    const promoSavings = Math.max(0, listSubtotal - afterPromoSubtotal);

    const cartWithDiscounts = cart.map((item) => ({
      ...item,
      price: getItemEffectivePrice(item),
    }));

    const discountInfo = getEffectiveDiscount();
    const activeTaxPercent = storeSettings?.taxEnabled ? storeSettings.taxPercent : 0;
    const isTaxInclusive = storeSettings?.taxEnabled ? !!storeSettings.taxInclusive : false;

    const calculation = calculateSaleTotals(
      cartWithDiscounts,
      discountInfo.type,
      discountInfo.value,
      activeTaxPercent,
      isTaxInclusive,
    );

    return {
      listSubtotal,
      promoSavings,
      subtotal: calculation.subtotal,
      couponDiscount: calculation.discountAmount,
      afterCoupon: calculation.subtotal - calculation.discountAmount,
      tax: calculation.taxAmount,
      total: calculation.total,
      taxPercent: calculation.taxPercent,
    };
  };

  useEffect(() => {
    if (customDiscountType === "coupon" && couponCode.trim() && !appliedCoupon && Array.isArray(coupons) && coupons.length > 0) {
      const found = coupons.find(
        (c: any) => c.name?.toLowerCase() === couponCode.trim().toLowerCase()
      );
      if (found) {
        setAppliedCoupon(found);
      }
    }
  }, [coupons, customDiscountType, couponCode, appliedCoupon]);

  const resetAfterSuccessfulSale = useCallback(() => {
    setCart([]);
    setCustomerPhone("");
    setCustomerName("");
    setSalespersonId("");
    setSalespersonName("");
    applyDefaultDiscount();
  }, [applyDefaultDiscount]);

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

  const submitSaleFromCart = useCallback(async () => {
    if (!user?.id) {
      throw new Error("Not signed in");
    }
    const finalCustomerName = customerName.trim() || "Walk-in Customer";
    const finalCustomerPhone = customerPhone.trim() || "0000000000";

    const discountInfo = getEffectiveDiscount();
    const activeTaxPercent = storeSettings?.taxEnabled ? storeSettings.taxPercent : 0;
    const isTaxInclusive = storeSettings?.taxEnabled ? !!storeSettings.taxInclusive : false;
    const calculation = calculateSaleTotals(
      cart.map((item) => ({
        ...item,
        price: getItemEffectivePrice(item),
      })),
      discountInfo.type,
      discountInfo.value,
      activeTaxPercent,
      isTaxInclusive,
    );

    const selectedSp = salespersons.find((s: any) => s.id === salespersonId);
    const finalSalespersonName = salespersonName || selectedSp?.name || null;

    const saleData = {
      user_id: user.id,
      customer_name: finalCustomerName,
      customer_phone: finalCustomerPhone,
      salesperson_id: salespersonId || null,
      salesperson_name: finalSalespersonName,
      items: cart.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        price: Math.round(getItemEffectivePrice(item)).toString(),
        name: item.name,
        sku: item.sku,
      })),
      subtotal: Math.round(calculation.subtotal).toString(),
      tax_percent: Math.round(calculation.taxPercent).toString(),
      tax_amount: Math.round(calculation.taxAmount).toString(),
      tax_inclusive: isTaxInclusive,
      discount_type: calculation.discountType,
      discount_value: Math.round(calculation.discountValue).toString(),
      discount_amount: Math.round(calculation.discountAmount).toString(),
      total_amount: Math.round(calculation.total).toString(),
      payment_method: paymentMethod,
      invoice_number: `INV-${Date.now()}`,
    } as any;

    const sale = await createSaleMutation.mutateAsync(saleData);

    const invoiceData: InvoiceData = {
      invoiceNumber:
        sale.invoiceNumber || sale.invoice_number || `INV-${Date.now()}`,
      date: new Date(),
      customerName: finalCustomerName,
      customerPhone: finalCustomerPhone,
      salespersonName: finalSalespersonName || undefined,
      items: cart.map((item) => {
        const price = Math.round(getItemEffectivePrice(item));
        return {
          name: item.name,
          quantity: item.quantity,
          price: price,
          total: price * item.quantity,
        };
      }),
      subtotal: Math.round(calculation.subtotal),
      tax: Math.round(calculation.taxAmount),
      taxPercent: Math.round(calculation.taxPercent),
      taxInclusive: isTaxInclusive,
      discountType: calculation.discountType || undefined,
      discountValue: Math.round(calculation.discountValue),
      discountAmount: Math.round(calculation.discountAmount),
      total: Math.round(calculation.total),
      paymentMethod,
      storeSettings: storeSettings ? {
        storeName: storeSettings.storeName,
        address: storeSettings.address,
        phone: storeSettings.phone,
        email: storeSettings.email,
        gstNumber: storeSettings.gstNumber,
        tagline: storeSettings.tagline,
        receiptFooter: storeSettings.receiptFooter,
        taxLabel: storeSettings.taxLabel,
        taxInclusive: storeSettings.taxInclusive,
        showSalespersonOnBill: storeSettings.showSalespersonOnBill,
        whatsappTemplate: storeSettings.whatsappTemplate,
        instagram: storeSettings.instagram,
        whatsappNumber: storeSettings.whatsappNumber,
      } : undefined,
    };
    setLastInvoiceData(invoiceData);
    setLastCustomerPhone(customerPhone);
  }, [
    user,
    cart,
    customerName,
    customerPhone,
    paymentMethod,
    appliedCoupon,
    getDiscountedUnitPrice,
    createSaleMutation,
    storeSettings,
  ]);

  const confirmPaymentAndCreateSale = useCallback(async () => {
    setIsConfirmingSale(true);
    try {
      await submitSaleFromCart();
      setShowConfirmPayment(false);
      setShowThankYou(true);
      resetAfterSuccessfulSale();
    } catch {
      // createSaleMutation / submitSaleFromCart surfaces toast
    } finally {
      setIsConfirmingSale(false);
    }
  }, [submitSaleFromCart, resetAfterSuccessfulSale]);

  const dismissConfirmPayment = useCallback(() => {
    setShowConfirmPayment(false);
  }, []);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to cart before checkout",
        variant: "destructive",
      });
      return;
    }

    const trimmedPhone = customerPhone.trim();
    const trimmedName = customerName.trim();

    // 0. Mandatory check: Customer details cannot be blank
    if (!trimmedName || !trimmedPhone) {
      toast({
        title: "Customer Details Required",
        description: "Please enter Customer Name & Phone number, or click Quick Fill for Walk-in Customer.",
        variant: "destructive",
      });
      return;
    }

    // 1. If custom phone is provided (not 0000000000 / N/A), it must be 10 digits and have a custom name
    if (trimmedPhone && trimmedPhone !== "0000000000" && trimmedPhone !== "N/A") {
      const cleanDigits = trimmedPhone.replace(/\D/g, "");
      if (cleanDigits.length !== 10) {
        toast({
          title: "Invalid Customer Phone",
          description: "Please enter a valid 10-digit phone number or click Quick Fill for Walk-in Customer.",
          variant: "destructive",
        });
        return;
      }
      if (trimmedName === "" || trimmedName.toLowerCase() === "walk-in customer") {
        toast({
          title: "Customer Name Required",
          description: "Please enter the customer's real name for this phone number.",
          variant: "destructive",
        });
        return;
      }
    }

    // 2. If custom customer name is provided, phone must be a valid 10-digit number
    if (trimmedName && trimmedName.toLowerCase() !== "walk-in customer") {
      const cleanDigits = trimmedPhone.replace(/\D/g, "");
      if (cleanDigits.length !== 10 || trimmedPhone === "0000000000") {
        toast({
          title: "10-Digit Phone Required",
          description: `Please enter a valid 10-digit phone number for customer "${trimmedName}".`,
          variant: "destructive",
        });
        return;
      }
    }

    for (const item of cart) {
      const minP = item.minPrice ? parseFloat(String(item.minPrice)) : null;
      const buyingP = item.buyingPrice ? parseFloat(String(item.buyingPrice)) : null;
      const minAllowed = minP != null ? minP : (buyingP != null ? buyingP : null);
      const effectivePrice = getItemEffectivePrice(item);

      if (minAllowed != null && effectivePrice < minAllowed) {
        toast({
          title: "Price Restricted",
          description: `Cannot checkout: ${item.name} price (₹${Math.round(effectivePrice)}) is below minimum allowed limit (₹${Math.round(minAllowed)}).`,
          variant: "destructive",
        });
        return;
      }
    }
    const prefs = getPosCheckoutPrefs();
    if (prefs.paymentConfirmMode === "none") {
      setIsProcessing(true);
      try {
        await submitSaleFromCart();
        setShowThankYou(true);
        resetAfterSuccessfulSale();
      } catch (error) {
        toast({
          title: "Checkout Failed",
          description: (error as Error).message,
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
      return;
    }
    setShowConfirmPayment(true);
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
      (c) => c.name.toLowerCase() === couponCode.toLowerCase(),
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
    salespersonId,
    salespersonName,
    isProcessing,
    isConfirmingSale,
    favorites,
    couponCode,
    appliedCoupon,
    customDiscountType,
    customDiscountValue,
    matchedCustomerName,
    restoreMatchedCustomerName: () => {
      if (matchedCustomerName) {
        setCustomerName(matchedCustomerName);
      }
    },
    // setters
    setProductCode,
    setShowScanner,
    setPaymentMethod,
    setShowConfirmPayment,
    setShowThankYou,
    setCustomerPhone,
    setCustomerName,
    setSalespersonId,
    setSalespersonName,
    setCouponCode,
    setCustomDiscountType,
    setCustomDiscountValue,
    // data
    products,
    salespersons,
    recentSales,
    mostSoldProducts,
    // actions
    addToCart,
    updateQuantity,
    updateItemPrice,
    removeFromCart,
    clearCart,
    toggleFavorite,
    handleProductSearch,
    handleScan,
    calculateTotals,
    handleCheckout,
    confirmPaymentAndCreateSale,
    dismissConfirmPayment,
    addRecentSaleToCart,
    addMostSoldToCart,
    applyCoupon,
    removeCoupon,
    isFavorite: (id: string) => favoritesStorage.isFavorite(id),
    getDiscountedUnitPrice,
    getFinalUnitPrice,
  };
}
