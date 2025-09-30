import { Product, Category, Sale, SaleItem } from "@shared/schema";

interface OfflineData {
  products: Product[];
  categories: Category[];
  sales: Sale[];
  lastSync: number;
  pendingChanges: {
    products: Product[];
    sales: Sale[];
  };
}

class OfflineStorage {
  private dbName = "shopflow-offline";
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores
        if (!db.objectStoreNames.contains("products")) {
          const productStore = db.createObjectStore("products", { keyPath: "id" });
          productStore.createIndex("sku", "sku", { unique: true });
          productStore.createIndex("barcode", "barcode", { unique: false });
        }
        
        if (!db.objectStoreNames.contains("categories")) {
          db.createObjectStore("categories", { keyPath: "id" });
        }
        
        if (!db.objectStoreNames.contains("sales")) {
          db.createObjectStore("sales", { keyPath: "id" });
        }
        
        if (!db.objectStoreNames.contains("metadata")) {
          db.createObjectStore("metadata", { keyPath: "key" });
        }
        
        if (!db.objectStoreNames.contains("pendingChanges")) {
          db.createObjectStore("pendingChanges", { keyPath: "id" });
        }
      };
    });
  }

  private async getStore(storeName: string, mode: IDBTransactionMode = "readonly"): Promise<IDBObjectStore> {
    if (!this.db) await this.init();
    const transaction = this.db!.transaction([storeName], mode);
    return transaction.objectStore(storeName);
  }

  // Products
  async getProducts(): Promise<Product[]> {
    try {
      const store = await this.getStore("products");
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch {
      return [];
    }
  }

  async saveProducts(products: Product[]): Promise<void> {
    const store = await this.getStore("products", "readwrite");
    const promises = products.map(product => 
      new Promise<void>((resolve, reject) => {
        const request = store.put(product);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      })
    );
    await Promise.all(promises);
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const store = await this.getStore("products");
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getProductBySku(sku: string): Promise<Product | undefined> {
    const store = await this.getStore("products");
    const index = store.index("sku");
    return new Promise((resolve, reject) => {
      const request = index.get(sku);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getProductByBarcode(barcode: string): Promise<Product | undefined> {
    const store = await this.getStore("products");
    const index = store.index("barcode");
    return new Promise((resolve, reject) => {
      const request = index.get(barcode);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    try {
      const store = await this.getStore("categories");
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch {
      return [];
    }
  }

  async saveCategories(categories: Category[]): Promise<void> {
    const store = await this.getStore("categories", "readwrite");
    const promises = categories.map(category => 
      new Promise<void>((resolve, reject) => {
        const request = store.put(category);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      })
    );
    await Promise.all(promises);
  }

  // Sales
  async saveSale(sale: Sale): Promise<void> {
    const store = await this.getStore("sales", "readwrite");
    return new Promise((resolve, reject) => {
      const request = store.put(sale);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getSales(): Promise<Sale[]> {
    try {
      const store = await this.getStore("sales");
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch {
      return [];
    }
  }

  // Pending changes for sync
  async addPendingChange(type: string, data: any): Promise<void> {
    const store = await this.getStore("pendingChanges", "readwrite");
    const change = {
      id: Date.now().toString(),
      type,
      data,
      timestamp: Date.now(),
    };
    
    return new Promise((resolve, reject) => {
      const request = store.put(change);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingChanges(): Promise<any[]> {
    try {
      const store = await this.getStore("pendingChanges");
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch {
      return [];
    }
  }

  async clearPendingChanges(): Promise<void> {
    const store = await this.getStore("pendingChanges", "readwrite");
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Metadata
  async setLastSync(timestamp: number): Promise<void> {
    const store = await this.getStore("metadata", "readwrite");
    return new Promise((resolve, reject) => {
      const request = store.put({ key: "lastSync", value: timestamp });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getLastSync(): Promise<number> {
    try {
      const store = await this.getStore("metadata");
      return new Promise((resolve, reject) => {
        const request = store.get("lastSync");
        request.onsuccess = () => resolve(request.result?.value || 0);
        request.onerror = () => reject(request.error);
      });
    } catch {
      return 0;
    }
  }
}

export const offlineStorage = new OfflineStorage();
