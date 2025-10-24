import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ManualScanner } from "@/components/pos/ManualScanner";
import { ScannerModal } from "@/components/shared/scanner-modal";
import {
  ShoppingCart,
  CreditCard,
  Search,
  Heart,
  Clock,
  TrendingUp,
} from "lucide-react";
import { useBilling } from "@/hooks/use-billing";
import { ProductSearch } from "@/components/pos/ProductSearch";
import { FavoriteProducts } from "@/components/pos/FavoriteProducts";
import { CartTable } from "@/components/pos/CartTable";
import { TotalsPanel } from "@/components/pos/TotalsPanel";
import { CheckoutDialog } from "@/components/pos/CheckoutDialog";
import { ThankYouModal } from "@/components/pos/ThankYouModal";
import { PaymentDetails } from "@/components/pos/PaymentDetails";
import { RecentSales } from "@/components/pos/RecentSales";
import { MostSold } from "@/components/pos/MostSold";


export function BillingInterface() {
  const {
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
    isFavorite,
  } = useBilling();


  const addFavoriteIdToCart = (favoriteId: string) => {
    const product = products.find((p) => p.id === favoriteId);
    if (product) addToCart(product);
  };

  const addProductIdToCart = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) addToCart(product);
  };

  // all handlers implemented inside useBilling hook

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
            <ProductSearch
              productCode={productCode}
              onChangeProductCode={setProductCode}
              onSearch={handleProductSearch}
              onOpenScanner={() => setShowScanner(true)}
              searchResults={searchResults as any}
              onAddToCart={addProductIdToCart}
              onToggleFavorite={(id) => {
                const p = products.find((x) => x.id === id);
                if (p) toggleFavorite(p);
              }}
              isFavorite={isFavorite}
            />
          </CardContent>
        </Card>
        <ManualScanner onScan={handleScan} />

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
              <FavoriteProducts
                favorites={favorites as any}
                onAddFavoriteToCart={addFavoriteIdToCart}
              />
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
              <RecentSales
                recentSales={recentSales as any}
                onAddRecentSaleToCart={addRecentSaleToCart}
              />
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
              <MostSold
                mostSoldProducts={mostSoldProducts as any}
                getProduct={(id) => products.find((p) => p.id === id)}
                onAddMostSoldToCart={addMostSoldToCart as any}
              />
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
            <CartTable
              items={cart as any}
              onDecrease={(productId) => {
                const item = cart.find((i) => i.productId === productId);
                if (!item) return;
                updateQuantity(productId, item.quantity - 1);
              }}
              onIncrease={(productId) => {
                const item = cart.find((i) => i.productId === productId);
                if (!item) return;
                updateQuantity(productId, item.quantity + 1);
              }}
              onRemove={removeFromCart}
            />
          </CardContent>
        </Card>
      </div>

      {/* Checkout Panel */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Bill Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <TotalsPanel
              subtotal={subtotal}
              couponDiscount={couponDiscount}
              tax={tax}
              total={total}
            />
          </CardContent>
        </Card>

        {/* Payment Details */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <PaymentDetails
              paymentMethod={paymentMethod}
              onChangePaymentMethod={setPaymentMethod}
              customerName={customerName}
              onChangeCustomerName={setCustomerName}
              customerPhone={customerPhone}
              onChangeCustomerPhone={setCustomerPhone}
              couponCode={couponCode}
              onChangeCouponCode={setCouponCode}
              hasAppliedCoupon={!!appliedCoupon}
              onApplyCoupon={applyCoupon}
              onRemoveCoupon={removeCoupon}
            />

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
      <CheckoutDialog
        open={showConfirmPayment}
        onOpenChange={setShowConfirmPayment}
        total={total}
        paymentMethod={paymentMethod}
        onConfirm={() => {
          setShowConfirmPayment(false);
          setShowThankYou(true);
          clearCart();
          setCustomerName("");
          setCustomerPhone("");
        }}
      />

      {/* Thank You Dialog */}
      <ThankYouModal
        open={showThankYou}
        onOpenChange={setShowThankYou}
        invoiceData={lastInvoiceData}
        customerPhone={lastCustomerPhone}
      />
    </div>
  );
}
