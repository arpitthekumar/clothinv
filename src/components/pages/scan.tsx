import { useEffect, useState } from "react";
import { Sidebar } from "@/components/shared/sidebar";
import { Header } from "@/components/shared/header";
import { ScannerModal } from "@/components/shared/scanner-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QrCode, Camera, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Scan() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [productCode, setProductCode] = useState("");
  const [scannedCode, setScannedCode] = useState("");
  const { toast } = useToast();

  const { data: product } = useQuery<{
    id: string;
    name: string;
    price: string;
    stock: number;
    sku: string;
  }>({
    queryKey: [`/api/products/barcode/${scannedCode}`],
    enabled: !!scannedCode,
  });

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  useEffect(() => {
    const isMobile = window.innerWidth < 768; // md breakpoint
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, []);
  const handleScan = (barcode: string) => {
    setScannedCode(barcode);
    setProductCode(barcode);
    toast({
      title: "Barcode Scanned",
      description: `Code: ${barcode}`,
    });
  };

  const handleManualSearch = () => {
    if (!productCode.trim()) return;
    setScannedCode(productCode);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar isOpen={sidebarOpen} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="Quick Scan"
          subtitle="Scan products quickly to check details"
          onSidebarToggle={toggleSidebar}
        />

        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Scanner Card */}
            <Card data-testid="card-scanner">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <QrCode className="mr-2 text-primary" />
                  Barcode Scanner
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted p-8 rounded-lg text-center">
                  <div className="animate-pulse mb-4">
                    <QrCode className="h-16 w-16 text-muted-foreground mx-auto" />
                  </div>
                  <p className="text-muted-foreground mb-4">
                    Ready to scan product barcodes
                  </p>
                  <Button
                    onClick={() => setShowScanner(true)}
                    size="lg"
                    data-testid="button-open-scanner"
                  >
                    <Camera className="mr-2 h-5 w-5" />
                    Start Camera Scanner
                  </Button>
                </div>

                {/* Manual Input */}
                <div className="border-t pt-4">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium">Manual Entry</label>
                      <p className="text-xs text-muted-foreground">
                        Enter barcode or product SKU manually
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter barcode or SKU"
                        value={productCode}
                        onChange={(e) => setProductCode(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleManualSearch()}
                        data-testid="input-manual-code"
                      />
                      <Button
                        onClick={handleManualSearch}
                        disabled={!productCode.trim()}
                        data-testid="button-search-manual"
                      >
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Product Result */}
            {product && (
              <Card data-testid="card-product-result">
                <CardHeader>
                  <CardTitle>Product Found</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg" data-testid="text-product-name">
                        {product.name}
                      </h3>
                      <p className="text-muted-foreground" data-testid="text-product-sku">
                        SKU: {product.sku}
                      </p>
                    </div>

                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-2xl font-bold" data-testid="text-product-price">
                          ₹{product.price}
                        </p>
                        <p className="text-sm text-muted-foreground" data-testid="text-product-stock">
                          Stock: {product.stock} units
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {scannedCode && !product && (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center text-muted-foreground">
                    <p>No product found for code: {scannedCode}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>

      <ScannerModal
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleScan}
      />
    </div>
  );
}