import { offlineStorage } from "./offline-storage";
import { apiRequest } from "./queryClient";

class SupabaseSync {
  private syncInterval: NodeJS.Timeout | null = null;
  private isOnline = navigator.onLine;
  private isSyncing = false;

  constructor() {
    this.setupEventListeners();
    this.startPeriodicSync();
  }

  private setupEventListeners(): void {
    window.addEventListener("online", () => {
      this.isOnline = true;
      this.syncData();
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
    });
  }

  private startPeriodicSync(): void {
    // Sync every 30 seconds when online
    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.syncData();
      }
    }, 30000);
  }

  async syncData(): Promise<void> {
    if (!this.isOnline || this.isSyncing) return;

    this.isSyncing = true;
    
    try {
      // Upload pending changes first
      await this.uploadPendingChanges();
      
      // Download latest data
      await this.downloadLatestData();
      
      // Update last sync time
      await offlineStorage.setLastSync(Date.now());
      
      // Dispatch custom event for UI updates
      window.dispatchEvent(new CustomEvent("dataSync", { 
        detail: { success: true, timestamp: Date.now() } 
      }));
    } catch (error) {
      console.error("Sync failed:", error);
      window.dispatchEvent(new CustomEvent("dataSync", { 
        detail: { success: false, error } 
      }));
    } finally {
      this.isSyncing = false;
    }
  }

  private async uploadPendingChanges(): Promise<void> {
    const pendingChanges = await offlineStorage.getPendingChanges();
    
    for (const change of pendingChanges) {
      try {
        switch (change.type) {
          case "sale":
            await apiRequest("POST", "/api/sales", change.data);
            break;
          case "product":
            if (change.data.id) {
              await apiRequest("PUT", `/api/products/${change.data.id}`, change.data);
            } else {
              await apiRequest("POST", "/api/products", change.data);
            }
            break;
          case "stock":
            await apiRequest("POST", `/api/products/${change.data.productId}/stock`, {
              quantity: change.data.quantity
            });
            break;
        }
      } catch (error) {
        console.error(`Failed to sync change ${change.id}:`, error);
        // Continue with other changes
      }
    }
    
    // Clear pending changes after successful upload
    await offlineStorage.clearPendingChanges();
  }

  private async downloadLatestData(): Promise<void> {
    try {
      // Download products
      const productsResponse = await fetch("/api/products", {
        credentials: "include"
      });
      if (productsResponse.ok) {
        const products = await productsResponse.json();
        await offlineStorage.saveProducts(products);
      }

      // Download categories
      const categoriesResponse = await fetch("/api/categories", {
        credentials: "include"
      });
      if (categoriesResponse.ok) {
        const categories = await categoriesResponse.json();
        await offlineStorage.saveCategories(categories);
      }
    } catch (error) {
      console.error("Failed to download data:", error);
    }
  }

  async forceSyncNow(): Promise<void> {
    if (!this.isOnline) {
      throw new Error("Cannot sync while offline");
    }
    
    await this.syncData();
  }

  getConnectionStatus(): { online: boolean; syncing: boolean } {
    return {
      online: this.isOnline,
      syncing: this.isSyncing
    };
  }

  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
  }
}

export const supabaseSync = new SupabaseSync();
