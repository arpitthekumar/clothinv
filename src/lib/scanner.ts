// QuaggaJS barcode scanner integration
declare global {
  interface Window {
    Quagga: {
      init: (config: unknown, callback: (err?: Error) => void) => void;
      start: () => void;
      stop: () => void;
      onDetected: (callback: (result: ScanResult) => void) => void;
      offDetected: (callback: (result: ScanResult) => void) => void;
    };
  }
}

export interface ScanResult {
  codeResult: {
    code: string;
    format: string;
  };
}

class BarcodeScanner {
  private isScanning = false;
  private stream: MediaStream | null = null;

  async initScanner(videoElement: HTMLVideoElement): Promise<void> {
    return new Promise((resolve, reject) => {
      // Load QuaggaJS if not already loaded
      if (!window.Quagga) {
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/quagga/0.12.1/quagga.min.js";
        script.onload = () => this.setupQuagga(videoElement, resolve, reject);
        script.onerror = () => reject(new Error("Failed to load scanner library"));
        document.head.appendChild(script);
      } else {
        this.setupQuagga(videoElement, resolve, reject);
      }
    });
  }

  private setupQuagga(videoElement: HTMLVideoElement, resolve: () => void, reject: (error: Error) => void): void {
    window.Quagga.init({
      inputStream: {
        name: "Live",
        type: "LiveStream",
        target: videoElement,
        constraints: {
          width: 640,
          height: 480,
          facingMode: "environment" // Use back camera
        }
      },
      decoder: {
        readers: [
          "code_128_reader",
          "ean_reader",
          "ean_8_reader",
          "code_39_reader",
          "code_39_vin_reader",
          "codabar_reader",
          "upc_reader",
          "upc_e_reader"
        ]
      },
      locator: {
        patchSize: "medium",
        halfSample: true
      },
      numOfWorkers: 2,
      frequency: 10,
      locate: true
    }, (err: any) => {
      if (err) {
        console.error("Scanner initialization failed:", err);
        reject(new Error("Failed to initialize scanner"));
        return;
      }
      
      window.Quagga.start();
      this.isScanning = true;
      resolve();
    });
  }

  onDetected(callback: (result: ScanResult) => void): void {
    window.Quagga.onDetected(callback);
  }

  async startScanning(): Promise<void> {
    if (this.isScanning) return;
    
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      window.Quagga.start();
      this.isScanning = true;
    } catch {
      throw new Error("Camera access denied or not available");
    }
  }

  stopScanning(): void {
    if (!this.isScanning) return;
    
    window.Quagga.stop();
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    this.isScanning = false;
  }

  isActive(): boolean {
    return this.isScanning;
  }
}

export const barcodeScanner = new BarcodeScanner();

// Alternative: Manual barcode input for testing
export function parseBarcode(input: string): string | null {
  // Basic validation for common barcode formats
  const cleaned = input.trim().replace(/\s+/g, "");
  
  if (cleaned.length >= 8 && cleaned.length <= 14 && /^\d+$/.test(cleaned)) {
    return cleaned;
  }
  
  return null;
}
