"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { invoicePrinter, type InvoiceData } from "@/lib/printer";
import { Product, SaleItem } from "@shared/schema";
import { favoritesStorage, type FavoriteProduct } from "@/lib/favorites";
import { normalizeItems } from "@/lib/json";

export interface CartItem extends SaleItem { id: string; stock: number }

export function useBilling() {
	const [cart, setCart] = useState<CartItem[]>([]);
	const [productCode, setProductCode] = useState("");
	const [searchResults, setSearchResults] = useState<Product[]>([]);
	const [showScanner, setShowScanner] = useState(false);
	const [paymentMethod, setPaymentMethod] = useState("cash");
	const [showConfirmPayment, setShowConfirmPayment] = useState(false);
	const [showThankYou, setShowThankYou] = useState(false);
	const [lastInvoiceData, setLastInvoiceData] = useState<InvoiceData | null>(null);
	const [lastCustomerPhone, setLastCustomerPhone] = useState<string>("");
	const [customerPhone, setCustomerPhone] = useState("");
	const [customerName, setCustomerName] = useState("");
	const [isProcessing, setIsProcessing] = useState(false);
	const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
	const [couponCode, setCouponCode] = useState("");
	const [appliedCoupon, setAppliedCoupon] = useState<any>(null);

	const { toast } = useToast();
	const { user } = useAuth();

	useEffect(() => { if (!productCode.trim()) setSearchResults([]); }, [productCode]);

	const { data: products = [] } = useQuery<Product[]>({ queryKey: ["/api/products"] });
	const { data: promotions = [] } = useQuery<any[]>({ queryKey: ["/api/promotions"] });
	const { data: promoTargets = [] } = useQuery<any[]>({ queryKey: ["/api/promotions/targets"] });
	const { data: recentSales = [] } = useQuery<any[]>({ queryKey: ["/api/sales/recent"] });
	const { data: mostSoldProducts = [] } = useQuery<any[]>({ queryKey: ["/api/products/most-sold"] });
	const { data: coupons = [] } = useQuery<any[]>({ queryKey: ["/api/coupons"] });

	useEffect(() => { setFavorites(favoritesStorage.getFavorites()); }, []);

	const toggleFavorite = (product: Product) => {
		const fav: FavoriteProduct = { id: product.id, name: product.name, sku: product.sku, price: product.price, stock: product.stock };
		if (favoritesStorage.isFavorite(product.id)) {
			favoritesStorage.removeFavorite(product.id);
			setFavorites(prev => prev.filter(f => f.id !== product.id));
			toast({ title: "Removed from Favorites", description: `${product.name} removed from favorites` });
		} else {
			favoritesStorage.addFavorite(fav);
			setFavorites(prev => [...prev, fav]);
			toast({ title: "Added to Favorites", description: `${product.name} added to favorites` });
		}
	};

const addToCart = (product: Product, quantity: number = 1) => {
		const existing = cart.find(i => i.productId === product.id);
		if (existing) {
			const newQty = existing.quantity + quantity;
			if (newQty > product.stock) { toast({ title: "Insufficient Stock", description: `Only ${product.stock} units available`, variant: "destructive" }); return; }
			setCart(prev => prev.map(i => i.productId === product.id ? { ...i, quantity: newQty } : i));
			return;
		}
		if (quantity > product.stock) { toast({ title: "Insufficient Stock", description: `Only ${product.stock} units available`, variant: "destructive" }); return; }
		const newItem: CartItem = { id: product.id, productId: product.id, name: product.name, sku: product.sku, quantity, price: product.price, stock: product.stock };
		setCart(prev => [...prev, newItem]);
	};

const updateQuantity = (productId: string, newQuantity: number) => {
		if (newQuantity <= 0) { removeFromCart(productId); return; }
		const current = cart.find(i => i.productId === productId);
		if (!current) return;
		if (newQuantity > current.stock) { toast({ title: "Insufficient Stock", description: `Only ${current.stock} units available`, variant: "destructive" }); return; }
		setCart(prev => prev.map(item => item.productId === productId ? { ...item, quantity: newQuantity } : item));
	};

	const removeFromCart = (productId: string) => setCart(prev => prev.filter(i => i.productId !== productId));
	const clearCart = () => { setCart([]); setCustomerPhone(""); };

	const handleProductSearch = () => {
		if (!productCode.trim()) { setSearchResults([]); return; }
		const query = productCode.toLowerCase();
		const results = products.filter((p: Product) => p.sku.toLowerCase() === query || p.barcode === productCode || p.name.toLowerCase().includes(query));
		setSearchResults(results);
	};

	const handleScan = (barcode: string) => {
		const product = products.find((p: Product) => p.barcode === barcode);
		if (product) { addToCart(product); toast({ title: "Product Scanned", description: `${product.name} added to cart` }); }
		else { toast({ title: "Product Not Found", description: "No product found with that barcode", variant: "destructive" }); }
	};

	const getDiscountedUnitPrice = (productId: string, basePrice: number) => {
		const product = products.find(p => p.id === productId); if (!product) return basePrice;
		const applicable = (promoTargets as any[]).map((t: any) => {
			const promo = promotions.find((p: any) => p.id === t.promotionId || p.id === t.promotion_id);
			if (!promo || promo.active === false) return null;
			const now = Date.now(); const starts = promo.startsAt || promo.starts_at; const ends = promo.endsAt || promo.ends_at;
			if (starts && new Date(starts).getTime() > now) return null; if (ends && new Date(ends).getTime() < now) return null;
			const targetType = t.targetType || t.target_type; const targetId = t.targetId || t.target_id;
			const matches = targetType === "product" ? targetId === productId : targetId === product.categoryId;
			return matches ? promo : null;
		}).filter(Boolean) as any[];
		if (applicable.length === 0) return basePrice;
		let best = basePrice; for (const promo of applicable) { const type = promo.type; const value = parseFloat(promo.value); let price = basePrice; if (type === "percent") price = basePrice * (1 - value / 100); if (type === "fixed") price = Math.max(0, basePrice - value); if (price < best) best = price; }
		return best;
	};

	const calculateTotals = () => {
		const subtotal = cart.reduce((sum, item) => { const unit = parseFloat(item.price); const discounted = getDiscountedUnitPrice(item.productId, unit); return sum + discounted * item.quantity; }, 0);
		let couponDiscount = 0; if (appliedCoupon) couponDiscount = subtotal * (parseFloat(appliedCoupon.percentage) / 100);
		const afterCoupon = subtotal - couponDiscount; const tax = afterCoupon * 0.18; const total = afterCoupon + tax; return { subtotal, couponDiscount, afterCoupon, tax, total };
	};

	const createSaleMutation = useMutation({
		mutationFn: async (saleData: any) => { const response = await apiRequest("POST", "/api/sales", saleData); return await response.json(); },
		onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/sales"] }); queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] }); },
	});

	const handleCheckout = async () => {
		if (cart.length === 0) { toast({ title: "Empty Cart", description: "Please add items to cart before checkout", variant: "destructive" }); return; }
		if (!customerName.trim() || !customerPhone.trim()) { toast({ title: "Customer details required", description: "Enter customer name and phone number", variant: "destructive" }); return; }
		setIsProcessing(true);
		try {
			const { subtotal, tax, total } = calculateTotals();
			const saleData = {
				userId: user!.id,
				items: cart.map(item => ({ productId: item.productId, quantity: item.quantity, price: getDiscountedUnitPrice(item.productId, parseFloat(item.price)).toFixed(2), name: item.name, sku: item.sku })),
				totalAmount: total.toFixed(2),
				paymentMethod,
			} as any;
			const sale = await createSaleMutation.mutateAsync(saleData);
			const invoiceData: InvoiceData = { invoiceNumber: sale.invoiceNumber || `INV-${Date.now()}`, date: new Date(), items: cart.map(item => ({ name: item.name, quantity: item.quantity, price: parseFloat(item.price), total: parseFloat(item.price) * item.quantity })), subtotal, tax, total, paymentMethod };
			setLastInvoiceData(invoiceData); setLastCustomerPhone(customerPhone); setShowConfirmPayment(true);
		} catch (error) {
			toast({ title: "Checkout Failed", description: (error as Error).message, variant: "destructive" });
		} finally { setIsProcessing(false); }
	};

	const addRecentSaleToCart = (sale: any) => {
		const items = normalizeItems(sale.items); if (Array.isArray(items)) { for (const it of items) { const product = products.find(p => p.id === it.productId); if (product) addToCart(product, it.quantity); } toast({ title: "Sale Items Added", description: `Items from sale ${sale.invoiceNumber} added to cart` }); }
	};

	const addMostSoldToCart = (mostSold: any) => {
		const product = products.find(p => p.id === mostSold.productId);
		if (product) { if (product.stock <= 0) { toast({ title: "Out of Stock", description: `${product.name} is currently out of stock`, variant: "destructive" }); return; } addToCart(product); }
	};

	const applyCoupon = () => { if (!couponCode.trim()) return; const coupon = (coupons as any[]).find(c => c.name.toLowerCase() === couponCode.toLowerCase()); if (coupon) { setAppliedCoupon(coupon); toast({ title: "Coupon Applied", description: `${coupon.percentage}% discount applied` }); } else { toast({ title: "Invalid Coupon", description: "Coupon code not found", variant: "destructive" }); } };
	const removeCoupon = () => { setAppliedCoupon(null); setCouponCode(""); toast({ title: "Coupon Removed", description: "Discount coupon removed" }); };

	return {
		// state
		cart, productCode, searchResults, showScanner, paymentMethod, showConfirmPayment, showThankYou,
		lastInvoiceData, lastCustomerPhone, customerPhone, customerName, isProcessing, favorites, couponCode, appliedCoupon,
		// setters
		setProductCode, setShowScanner, setPaymentMethod, setShowConfirmPayment, setShowThankYou, setCustomerPhone, setCustomerName, setCouponCode,
		// data
		products, recentSales, mostSoldProducts,
		// actions
		addToCart, updateQuantity, removeFromCart, clearCart,
		toggleFavorite, handleProductSearch, handleScan, calculateTotals, handleCheckout,
		addRecentSaleToCart, addMostSoldToCart, applyCoupon, removeCoupon,
		isFavorite: (id: string) => favoritesStorage.isFavorite(id),
	};
}


