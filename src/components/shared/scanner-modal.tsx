import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, X, RotateCcw } from "lucide-react";
import { barcodeScanner, parseBarcode } from "@/lib/scanner";
import { useToast } from "@/hooks/use-toast";

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

export function ScannerModal({ isOpen, onClose, onScan }: ScannerModalProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [cameraError, setCameraError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  const handleStopScanning = useCallback(() => {
    barcodeScanner.stopScanning();
    setIsScanning(false);
  }, []);

  const handleClose = useCallback(() => {
    if (isScanning) {
      handleStopScanning();
    }
    setManualInput("");
    setCameraError("");
    onClose();
  }, [isScanning, handleStopScanning, onClose]);

  const initializeScanner = useCallback(async () => {
    try {
      setCameraError("");
      await barcodeScanner.initScanner(videoRef.current!);

      barcodeScanner.onDetected((result) => {
        const code = result.codeResult.code;
        toast({
          title: "Barcode Detected",
          description: `Scanned: ${code}`,
        });
        onScan(code);
        handleClose();
      });
    } catch {
      setCameraError("Camera access denied or not available");
      setIsScanning(false);
    }
  }, [toast, onScan, handleClose]);

  const handleStartScanning = useCallback(() => {
    setIsScanning(true);
  }, []);

  const handleManualSubmit = useCallback(() => {
    const parsed = parseBarcode(manualInput);
    if (parsed) {
      onScan(parsed);
      handleClose();
    } else {
      toast({
        title: "Invalid Barcode",
        description: "Please enter a valid barcode number",
        variant: "destructive",
      });
    }
  }, [manualInput, onScan, handleClose, toast]);

  useEffect(() => {
    if (isOpen && isScanning && videoRef.current) {
      initializeScanner();
    }

    return () => {
      if (isScanning) {
        barcodeScanner.stopScanning();
        setIsScanning(false);
      }
    };
  }, [isOpen, isScanning, initializeScanner]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" data-testid="modal-scanner">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Scan Barcode/QR Code
          </DialogTitle>
          <DialogDescription>
            Use your camera to scan a barcode or enter the barcode number manually.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Camera Scanner */}
          <div className="space-y-3">
            <div className="relative">
              <div className="w-full h-64 bg-muted rounded-lg overflow-hidden relative">
                {isScanning ? (
                  <>
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      autoPlay
                      muted
                      playsInline
                    />
                    <div className="absolute inset-0 border-2 border-primary animate-pulse pointer-events-none" />
                    <div className="absolute bottom-2 left-2 text-xs bg-black bg-opacity-50 text-white px-2 py-1 rounded">
                      Position barcode within frame
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        {cameraError || "Camera ready to scan"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              {!isScanning ? (
                <Button 
                  onClick={handleStartScanning} 
                  className="flex-1"
                  data-testid="button-start-scanning"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Start Camera
                </Button>
              ) : (
                <>
                  <Button 
                    onClick={handleStopScanning} 
                    variant="outline"
                    className="flex-1"
                    data-testid="button-stop-scanning"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Stop Camera
                  </Button>
                  <Button 
                    onClick={() => {
                      handleStopScanning();
                      setTimeout(handleStartScanning, 100);
                    }}
                    variant="outline"
                    data-testid="button-restart-camera"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Manual Input */}
          <div className="border-t pt-4">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Manual Entry</label>
                <p className="text-xs text-muted-foreground">
                  Enter barcode number if camera scanning fails
                </p>
              </div>
              
              <div className="flex gap-2">
                <Input
                  placeholder="Enter barcode number"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
                  data-testid="input-manual-barcode"
                />
                <Button 
                  onClick={handleManualSubmit}
                  disabled={!manualInput.trim()}
                  data-testid="button-submit-manual"
                >
                  Submit
                </Button>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <Button 
            variant="outline" 
            onClick={handleClose} 
            className="w-full"
            data-testid="button-close-scanner"
          >
            Close Scanner
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
