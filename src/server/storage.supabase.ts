import { getSupabaseServer } from "./supabase";
import { type IStorage } from "./storage";
import { type User, type InsertUser, type Product, type InsertProduct, type Category, type InsertCategory, type Sale, type InsertSale, type StockMovement, type InsertStockMovement } from "@shared/schema";

export class SupabaseStorage implements IStorage {
  private get client() {
    const sb = getSupabaseServer();
    if (!sb) {
      throw new Error(
        "Supabase not configured. Please check your environment variables:\n" +
        "- SUPABASE_URL should be https://your-project-id.supabase.co\n" +
        "- SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY should be set\n" +
        "Check your .env.local file and restart your development server."
      );
    }
    return sb;
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    const { data, error } = await this.client.from("users").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return (data ?? undefined) as User | undefined;
  }
  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data, error } = await this.client.from("users").select("*").eq("username", username).maybeSingle();
    if (error) throw error;
    return (data ?? undefined) as User | undefined;
  }
  async createUser(user: InsertUser): Promise<User> {
    const { data, error } = await this.client.from("users").insert(user).select("*").single();
    if (error) throw error;
    return data as User;
  }
  async updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined> {
    const { data, error } = await this.client.from("users").update(user).eq("id", id).select("*").maybeSingle();
    if (error) throw error;
    return (data ?? undefined) as User | undefined;
  }
  async deleteUser(id: string): Promise<boolean> {
    const { error } = await this.client.from("users").delete().eq("id", id);
    if (error) throw error;
    return true;
  }
  async getUsers(): Promise<User[]> {
    const { data, error } = await this.client.from("users").select("*");
    if (error) throw error;
    return data as User[];
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    const { data, error } = await this.client.from("categories").select("*");
    if (error) throw error;
    return data as Category[];
  }
  async createCategory(category: InsertCategory): Promise<Category> {
    const { data, error } = await this.client.from("categories").insert(category).select("*").single();
    if (error) throw error;
    return data as Category;
  }
  async updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined> {
    const { data, error } = await this.client.from("categories").update(category).eq("id", id).select("*").maybeSingle();
    if (error) throw error;
    return (data ?? undefined) as Category | undefined;
  }
  async deleteCategory(id: string): Promise<boolean> {
    const { error } = await this.client.from("categories").delete().eq("id", id);
    if (error) throw error;
    return true;
  }

  // Products
  async getProducts(includeDeleted?: boolean): Promise<Product[]> {
    let query = this.client.from("products").select("*");
    
    if (!includeDeleted) {
      query = query.eq("deleted", false);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data as Product[];
  }
  async getProduct(id: string): Promise<Product | undefined> {
    const { data, error } = await this.client.from("products").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return (data ?? undefined) as Product | undefined;
  }
  async getProductBySku(sku: string): Promise<Product | undefined> {
    const { data, error } = await this.client.from("products").select("*").eq("sku", sku).maybeSingle();
    if (error) throw error;
    return (data ?? undefined) as Product | undefined;
  }
  async getProductByBarcode(barcode: string): Promise<Product | undefined> {
    const { data, error } = await this.client.from("products").select("*").eq("barcode", barcode).maybeSingle();
    if (error) throw error;
    return (data ?? undefined) as Product | undefined;
  }
  async createProduct(product: InsertProduct): Promise<Product> {
    const { data, error } = await this.client.from("products").insert(product).select("*").single();
    if (error) throw error;
    return data as Product;
  }
  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const { data, error } = await this.client.from("products").update(product).eq("id", id).select("*").maybeSingle();
    if (error) throw error;
    return (data ?? undefined) as Product | undefined;
  }
  async deleteProduct(id: string): Promise<boolean> {
    const { error } = await this.client.from("products").delete().eq("id", id);
    if (error) throw error;
    return true;
  }
  async softDeleteProduct(id: string): Promise<boolean> {
    // Use snake_case column name to match Supabase schema cache
    const { error } = await this.client
      .from("products")
      .update({ deleted: true, deleted_at: new Date().toISOString() as any })
      .eq("id", id);
    if (error) throw error;
    return true;
  }
  async restoreProduct(id: string): Promise<boolean> {
    // Use snake_case for deleted_at when restoring as well
    const { error } = await this.client
      .from("products")
      .update({ deleted: false, deleted_at: null as any })
      .eq("id", id);
    if (error) throw error;
    return true;
  }
  async updateStock(id: string, quantity: number): Promise<Product | undefined> {
    const { data, error } = await this.client.from("products").update({ stock: quantity }).eq("id", id).select("*").maybeSingle();
    if (error) throw error;
    return (data ?? undefined) as Product | undefined;
  }

  // Sales
  async getSales(): Promise<Sale[]> {
    const { data, error } = await this.client.from("sales").select("*");
    if (error) throw error;
    return data as Sale[];
  }
  async getSalesByUser(userId: string): Promise<Sale[]> {
    const { data, error } = await this.client.from("sales").select("*").eq("userId", userId);
    if (error) throw error;
    return data as Sale[];
  }
  async getSalesToday(): Promise<Sale[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { data, error } = await this.client
      .from("sales")
      .select("*")
      .gte("createdAt", today.toISOString());
    if (error) throw error;
    return data as Sale[];
  }
  async createSale(sale: InsertSale): Promise<Sale> {
    const { data, error } = await this.client.from("sales").insert(sale).select("*").single();
    if (error) throw error;
    return data as Sale;
  }

  // Stock Movements
  async getStockMovements(): Promise<StockMovement[]> {
    const { data, error } = await this.client.from("stockMovements").select("*");
    if (error) throw error;
    return data as StockMovement[];
  }
  async getStockMovementsByProduct(productId: string): Promise<StockMovement[]> {
    const { data, error } = await this.client.from("stockMovements").select("*").eq("productId", productId);
    if (error) throw error;
    return data as StockMovement[];
  }
  async createStockMovement(movement: InsertStockMovement): Promise<StockMovement> {
    const { data, error } = await this.client.from("stockMovements").insert(movement).select("*").single();
    if (error) throw error;
    return data as StockMovement;
  }
}