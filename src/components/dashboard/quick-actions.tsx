"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QrCode, ScanBarcode, Camera } from "lucide-react";
import { ScannerModal } from "@/components/shared/scanner-modal";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

export function QuickActions() {
  const [showScanner, setShowScanner] = useState(false);
  const [scannedCode, setScannedCode] = useState("");
  const [productCode, setProductCode] = useState("");
  const { toast } = useToast();

  const { data: product, refetch: findProduct } = useQuery<{
    id: string;
    name: string;
    price: string;
    stock: number;
  }>({
    queryKey: [`/api/products/barcode/${scannedCode}`],
    enabled: !!scannedCode,
  });

  const handleScan = async (barcode: string) => {
    setScannedCode(barcode);
    setProductCode(barcode);
    // Online-only: directly fetch via query
    findProduct();
  };

  const handleQuickSearch = async () => {
    if (!productCode.trim()) return;
    setScannedCode(productCode);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Quick Scan */}
      <Card data-testid="card-quick-scan">
        <CardHeader>
          <CardTitle className="flex items-center">
            <QrCode className="mr-2 text-primary" />
            Quick Scan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg text-center">
            <div className="animate-pulse">
              <QrCode className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            </div>
            <p className="text-sm text-muted-foreground">Ready to scan barcode/QR</p>
          </div>
          
          <Button 
            onClick={() => setShowScanner(true)} 
            className="w-full"
            data-testid="button-start-scan"
          >
            <Camera className="mr-2 h-4 w-4" />
            Start Scanning
          </Button>

          {/* Manual product search */}
          <div className="pt-2 border-t">
            <div className="flex gap-2">
              <Input
                placeholder="Enter product code"
                value={productCode}
                onChange={(e) => setProductCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleQuickSearch()}
                data-testid="input-product-code"
              />
              <Button 
                variant="outline" 
                onClick={handleQuickSearch}
                disabled={!productCode.trim()}
                data-testid="button-search-product"
              >
                Search
              </Button>
            </div>
          </div>

          {/* Product result */}
          {product && (
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <p className="font-medium">{product.name}</p>
              <p className="text-sm text-muted-foreground">₹{product.price} • Stock: {product.stock}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fast Billing */}
      <Card data-testid="card-fast-billing">
        <CardHeader>
          <CardTitle className="flex items-center">
            <ScanBarcode className="mr-2 text-primary" />
            Fast Billing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Scan or enter product code"
            value={productCode}
            onChange={(e) => setProductCode(e.target.value)}
            data-testid="input-billing-product"
          />
          
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm font-medium" data-testid="text-cart-items">Cart: 0 items</p>
            <p className="text-lg font-bold" data-testid="text-cart-total">₹0.00</p>
          </div>
          
          <Link href="/pos">
            <Button className="w-full bg-green-600 hover:bg-green-700" data-testid="button-generate-bill">
              <ScanBarcode className="mr-2 h-4 w-4" />
              Generate Bill
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card data-testid="card-quick-actions">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Link href="/inventory?action=add">
            <Button variant="outline" className="w-full justify-start" data-testid="button-add-product">
              Add Product
            </Button>
          </Link>
          
          <Link href="/inventory?action=update">
            <Button variant="outline" className="w-full justify-start" data-testid="button-update-stock">
              Update Stock
            </Button>
          </Link>
          
          <Link href="/reports">
            <Button variant="outline" className="w-full justify-start" data-testid="button-generate-report">
              Generate Report
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Scanner Modal */}
      <ScannerModal
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleScan}
      />
    </div>
  );
}
