import { type User, type InsertUser, type Product, type InsertProduct, type Category, type InsertCategory, type Sale, type InsertSale, type StockMovement, type InsertStockMovement, users, categories, products, sales, stockMovements } from "@shared/schema";
import { randomUUID } from "crypto";
import { getDb, hasDatabase } from "./db";
import { eq, gte } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  getUsers(): Promise<User[]>;

  // Categories
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<boolean>;

  // Products
  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  getProductBySku(sku: string): Promise<Product | undefined>;
  getProductByBarcode(barcode: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;
  updateStock(id: string, quantity: number): Promise<Product | undefined>;

  // Sales
  getSales(): Promise<Sale[]>;
  getSalesByUser(userId: string): Promise<Sale[]>;
  getSalesToday(): Promise<Sale[]>;
  createSale(sale: InsertSale): Promise<Sale>;

  // Stock Movements
  getStockMovements(): Promise<StockMovement[]>;
  getStockMovementsByProduct(productId: string): Promise<StockMovement[]>;
  createStockMovement(movement: InsertStockMovement): Promise<StockMovement>;
}

class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private categories: Map<string, Category> = new Map();
  private products: Map<string, Product> = new Map();
  private sales: Map<string, Sale> = new Map();
  private stockMovements: Map<string, StockMovement> = new Map();

  async getUser(id: string): Promise<User | undefined> { return this.users.get(id); }
  async getUserByUsername(username: string): Promise<User | undefined> { return Array.from(this.users.values()).find(u => u.username === username); }
  async createUser(insertUser: InsertUser): Promise<User> { const id = randomUUID(); const user: User = { id, createdAt: new Date(), username: insertUser.username, password: insertUser.password, fullName: insertUser.fullName, role: insertUser.role ?? "employee" }; this.users.set(id, user); return user; }
  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> { const user = this.users.get(id); if (!user) return undefined; const updated: User = { ...user, ...updates, role: updates.role ?? user.role }; this.users.set(id, updated); return updated; }
  async deleteUser(id: string): Promise<boolean> { return this.users.delete(id); }
  async getUsers(): Promise<User[]> { return Array.from(this.users.values()); }

  async getCategories(): Promise<Category[]> { return Array.from(this.categories.values()); }
  async createCategory(insertCategory: InsertCategory): Promise<Category> { const id = randomUUID(); const category: Category = { id, createdAt: new Date(), name: insertCategory.name, description: insertCategory.description ?? null }; this.categories.set(id, category); return category; }
  async updateCategory(id: string, updates: Partial<InsertCategory>): Promise<Category | undefined> { const category = this.categories.get(id); if (!category) return undefined; const updated = { ...category, ...updates }; this.categories.set(id, updated); return updated; }
  async deleteCategory(id: string): Promise<boolean> { return this.categories.delete(id); }

  async getProducts(): Promise<Product[]> { return Array.from(this.products.values()); }
  async getProduct(id: string): Promise<Product | undefined> { return this.products.get(id); }
  async getProductBySku(sku: string): Promise<Product | undefined> { return Array.from(this.products.values()).find(p => p.sku === sku); }
  async getProductByBarcode(barcode: string): Promise<Product | undefined> { return Array.from(this.products.values()).find(p => p.barcode === barcode); }
  async createProduct(insertProduct: InsertProduct): Promise<Product> { const id = randomUUID(); const product: Product = { id, createdAt: new Date(), updatedAt: new Date(), name: insertProduct.name, sku: insertProduct.sku, price: insertProduct.price, size: insertProduct.size ?? null, description: insertProduct.description ?? null, categoryId: insertProduct.categoryId ?? null, stock: insertProduct.stock ?? 0, minStock: insertProduct.minStock ?? null, barcode: insertProduct.barcode ?? null }; this.products.set(id, product); return product; }
  async updateProduct(id: string, updates: Partial<InsertProduct>): Promise<Product | undefined> { const product = this.products.get(id); if (!product) return undefined; const updated = { ...product, ...updates, updatedAt: new Date() }; this.products.set(id, updated); return updated; }
  async deleteProduct(id: string): Promise<boolean> { return this.products.delete(id); }
  async updateStock(id: string, quantity: number): Promise<Product | undefined> { const product = this.products.get(id); if (!product) return undefined; const updated = { ...product, stock: quantity, updatedAt: new Date() }; this.products.set(id, updated); return updated; }

  async getSales(): Promise<Sale[]> { return Array.from(this.sales.values()); }
  async getSalesByUser(userId: string): Promise<Sale[]> { return Array.from(this.sales.values()).filter(s => s.userId === userId); }
  async getSalesToday(): Promise<Sale[]> { const today = new Date(); today.setHours(0,0,0,0); return Array.from(this.sales.values()).filter(s => s.createdAt && s.createdAt >= today); }
  async createSale(insertSale: InsertSale): Promise<Sale> { const id = randomUUID(); const sale: Sale = { id, createdAt: new Date(), userId: insertSale.userId, items: (insertSale as any).items, totalAmount: insertSale.totalAmount, paymentMethod: insertSale.paymentMethod ?? "cash", invoiceNumber: insertSale.invoiceNumber }; this.sales.set(id, sale); return sale; }

  async getStockMovements(): Promise<StockMovement[]> { return Array.from(this.stockMovements.values()); }
  async getStockMovementsByProduct(productId: string): Promise<StockMovement[]> { return Array.from(this.stockMovements.values()).filter(m => m.productId === productId); }
  async createStockMovement(insertMovement: InsertStockMovement): Promise<StockMovement> { const id = randomUUID(); const movement: StockMovement = { id, createdAt: new Date(), userId: insertMovement.userId, productId: insertMovement.productId, type: insertMovement.type, quantity: insertMovement.quantity, reason: insertMovement.reason ?? null }; this.stockMovements.set(id, movement); return movement; }
}

export const storage: IStorage = new MemStorage();

// If a DATABASE_URL is present, override with Postgres-backed storage
class PgStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const db = getDb();
    if (!db) return undefined;
    const rows = await db.select().from(users).where(eq(users.id, id));
    return rows[0];
  }
  async getUserByUsername(username: string): Promise<User | undefined> {
    const db = getDb();
    if (!db) return undefined;
    const rows = await db.select().from(users).where(eq(users.username, username));
    return rows[0];
  }
  async createUser(insertUser: InsertUser): Promise<User> {
    const db = getDb()!;
    const [row] = await db.insert(users).values(insertUser as any).returning();
    return row as User;
  }
  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const db = getDb()!;
    const [row] = await db.update(users).set(updates as any).where(eq(users.id, id)).returning();
    return row as User | undefined;
  }
  async deleteUser(id: string): Promise<boolean> {
    const db = getDb()!;
    const res = await db.delete(users).where(eq(users.id, id)).returning({ id: users.id });
    return res.length > 0;
  }
  async getUsers(): Promise<User[]> {
    const db = getDb()!;
    const rows = await db.select().from(users);
    return rows as User[];
  }

  async getCategories(): Promise<Category[]> {
    const db = getDb()!;
    return await db.select().from(categories);
  }
  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const db = getDb()!;
    const [row] = await db.insert(categories).values(insertCategory as any).returning();
    return row as Category;
  }
  async updateCategory(id: string, updates: Partial<InsertCategory>): Promise<Category | undefined> {
    const db = getDb()!;
    const [row] = await db.update(categories).set(updates as any).where(eq(categories.id, id)).returning();
    return row as Category | undefined;
  }
  async deleteCategory(id: string): Promise<boolean> {
    const db = getDb()!;
    const res = await db.delete(categories).where(eq(categories.id, id)).returning({ id: categories.id });
    return res.length > 0;
  }

  async getProducts(): Promise<Product[]> {
    const db = getDb()!;
    return await db.select().from(products);
  }
  async getProduct(id: string): Promise<Product | undefined> {
    const db = getDb()!;
    const rows = await db.select().from(products).where(eq(products.id, id));
    return rows[0];
  }
  async getProductBySku(sku: string): Promise<Product | undefined> {
    const db = getDb()!;
    const rows = await db.select().from(products).where(eq(products.sku, sku));
    return rows[0];
  }
  async getProductByBarcode(barcode: string): Promise<Product | undefined> {
    const db = getDb()!;
    const rows = await db.select().from(products).where(eq(products.barcode, barcode));
    return rows[0];
  }
  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const db = getDb()!;
    const [row] = await db.insert(products).values(insertProduct as any).returning();
    return row as Product;
  }
  async updateProduct(id: string, updates: Partial<InsertProduct>): Promise<Product | undefined> {
    const db = getDb()!;
    const [row] = await db.update(products).set({ ...(updates as any), updatedAt: new Date() } as any).where(eq(products.id, id)).returning();
    return row as Product | undefined;
  }
  async deleteProduct(id: string): Promise<boolean> {
    const db = getDb()!;
    const res = await db.delete(products).where(eq(products.id, id)).returning({ id: products.id });
    return res.length > 0;
  }
  async updateStock(id: string, quantity: number): Promise<Product | undefined> {
    const db = getDb()!;
    const [row] = await db.update(products).set({ stock: quantity, updatedAt: new Date() } as any).where(eq(products.id, id)).returning();
    return row as Product | undefined;
  }

  async getSales(): Promise<Sale[]> {
    const db = getDb()!;
    return await db.select().from(sales);
  }
  async getSalesByUser(userId: string): Promise<Sale[]> {
    const db = getDb()!;
    return await db.select().from(sales).where(eq(sales.userId, userId));
  }
  async getSalesToday(): Promise<Sale[]> {
    const db = getDb()!;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return await db.select().from(sales).where(gte(sales.createdAt, today as any));
  }
  async createSale(insertSale: InsertSale): Promise<Sale> {
    const db = getDb()!;
    const [row] = await db.insert(sales).values(insertSale as any).returning();
    return row as Sale;
  }

  async getStockMovements(): Promise<StockMovement[]> {
    const db = getDb()!;
    return await db.select().from(stockMovements);
  }
  async getStockMovementsByProduct(productId: string): Promise<StockMovement[]> {
    const db = getDb()!;
    return await db.select().from(stockMovements).where(eq(stockMovements.productId, productId));
  }
  async createStockMovement(insertMovement: InsertStockMovement): Promise<StockMovement> {
    const db = getDb()!;
    const [row] = await db.insert(stockMovements).values(insertMovement as any).returning();
    return row as StockMovement;
  }
}

if (hasDatabase) {
  (module as any).exports.storage = new PgStorage() as IStorage;
}


