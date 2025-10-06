import { getSupabaseServer } from "./supabase";
import { type IStorage } from "./storage";
import { type User, type InsertUser, type Product, type InsertProduct, type Category, type InsertCategory, type Sale, type InsertSale, type StockMovement, type InsertStockMovement, type Supplier, type InsertSupplier, type PurchaseOrder, type InsertPurchaseOrder, type PurchaseOrderItem, type InsertPurchaseOrderItem } from "@shared/schema";

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

  // Suppliers
  async getSuppliers(): Promise<Supplier[]> {
    const { data, error } = await this.client.from("suppliers").select("*");
    if (error) throw error;
    return data as Supplier[];
  }
  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    const { data, error } = await this.client.from("suppliers").insert(supplier).select("*").single();
    if (error) throw error;
    return data as Supplier;
  }

  // Purchase Orders
  async getPurchaseOrders(): Promise<PurchaseOrder[]> {
    const { data, error } = await this.client.from("purchase_orders").select("*");
    if (error) throw error;
    return data as PurchaseOrder[];
  }
  async createPurchaseOrder(po: InsertPurchaseOrder): Promise<PurchaseOrder> {
    const { data, error } = await this.client.from("purchase_orders").insert(po).select("*").single();
    if (error) throw error;
    return data as PurchaseOrder;
  }
  async addPurchaseOrderItem(item: InsertPurchaseOrderItem): Promise<PurchaseOrderItem> {
    const { data, error } = await this.client.from("purchase_order_items").insert(item).select("*").single();
    if (error) throw error;
    return data as PurchaseOrderItem;
  }
  async receivePurchaseOrderItems(params: { items: Array<{ purchaseOrderItemId: string; quantity: number }>; userId: string }): Promise<void> {
    const { items, userId } = params;
    const sb = this.client;
    const txn = sb; // Supabase PostgREST cannot do multi-step tx in one call; perform sequentially.

    for (const item of items) {
      // 1) Load PO item with product and unitCost
      const { data: poi, error: poiErr } = await txn
        .from("purchase_order_items")
        .select("id, productId:product_id, unitCost:unit_cost, quantityReceived:quantity_received")
        .eq("id", item.purchaseOrderItemId)
        .maybeSingle();
      if (poiErr) throw poiErr;
      if (!poi) continue;

      const newReceived = (poi.quantityReceived ?? 0) + item.quantity;
      // 2) Update received quantity
      const { error: updErr } = await txn
        .from("purchase_order_items")
        .update({ quantity_received: newReceived as any })
        .eq("id", item.purchaseOrderItemId);
      if (updErr) throw updErr;

      // 3) Increment product stock
      const { data: productRow, error: prodErr } = await txn
        .from("products")
        .select("id, stock")
        .eq("id", poi.productId)
        .maybeSingle();
      if (prodErr) throw prodErr;
      const currentStock = (productRow?.stock ?? 0) as number;
      const newStock = currentStock + item.quantity;
      const { error: stockErr } = await txn
        .from("products")
        .update({ stock: newStock as any })
        .eq("id", poi.productId);
      if (stockErr) throw stockErr;

      // 4) Create stock movement
      const { error: moveErr } = await txn
        .from("stock_movements")
        .insert({
          product_id: poi.productId,
          user_id: userId,
          type: "po_receipt",
          quantity: item.quantity,
          reason: "PO receive",
          ref_table: "purchase_order_items",
          ref_id: item.purchaseOrderItemId,
        } as any);
      if (moveErr) throw moveErr;

      // 5) Write cost history from unitCost
      const { error: costErr } = await txn
        .from("product_cost_history")
        .insert({
          product_id: poi.productId,
          cost: poi.unitCost,
          source: "PO",
        } as any);
      if (costErr) throw costErr;
    }
  }

  // Sales normalization & Returns
  async createSaleItems(saleId: string, items: Array<{ productId: string; quantity: number; price: string; name: string; sku: string }>): Promise<void> {
    for (const it of items) {
      const { error } = await this.client
        .from("sale_items")
        .insert({
          sale_id: saleId,
          product_id: it.productId,
          quantity: it.quantity as any,
          price: it.price as any,
          name: it.name,
          sku: it.sku,
        } as any);
      if (error) throw error;
    }
  }

  async createSalesReturn(params: { saleId: string; customerId?: string; reason?: string; items: Array<{ productId: string; saleItemId?: string; quantity: number; refundAmount?: string }>; userId: string }): Promise<{ salesReturnId: string }> {
    const { saleId, customerId, reason, items, userId } = params;
    const { data: sr, error: srErr } = await this.client
      .from("sales_returns")
      .insert({ sale_id: saleId, customer_id: customerId as any, reason })
      .select("id")
      .single();
    if (srErr) throw srErr;

    for (const it of items) {
      const { error: sriErr } = await this.client
        .from("sales_return_items")
        .insert({
          sales_return_id: sr.id,
          sale_item_id: it.saleItemId as any,
          product_id: it.productId,
          quantity: it.quantity as any,
          refund_amount: (it.refundAmount ?? null) as any,
        } as any);
      if (sriErr) throw sriErr;

      // Restock and create movement
      const { data: productRow, error: prodErr } = await this.client
        .from("products")
        .select("id, stock")
        .eq("id", it.productId)
        .maybeSingle();
      if (prodErr) throw prodErr;
      const currentStock = (productRow?.stock ?? 0) as number;
      const newStock = currentStock + it.quantity;
      const { error: stockErr } = await this.client
        .from("products")
        .update({ stock: newStock as any })
        .eq("id", it.productId);
      if (stockErr) throw stockErr;

      const { error: moveErr } = await this.client
        .from("stock_movements")
        .insert({
          product_id: it.productId,
          user_id: userId,
          type: "return_in",
          quantity: it.quantity,
          reason: `Sales return for sale ${saleId}`,
          ref_table: "sales_return_items",
          ref_id: sr.id,
        } as any);
      if (moveErr) throw moveErr;
    }

    return { salesReturnId: sr.id as string };
  }

  // Promotions
  async getPromotions() {
    const { data, error } = await this.client.from("promotions").select("*").eq("active", true);
    if (error) throw error;
    return data as any;
  }
  async createPromotion(promo: any) {
    const { data, error } = await this.client.from("promotions").insert(promo).select("*").single();
    if (error) throw error;
    return data as any;
  }
  async addPromotionTarget(target: any) {
    const { data, error } = await this.client.from("promotion_targets").insert(target).select("*").single();
    if (error) throw error;
    return data as any;
  }
  async getPromotionTargets() {
    const { data, error } = await this.client.from("promotion_targets").select("*");
    if (error) throw error;
    return data as any[];
  }

  // Reports (approximate queries)
  async getNotSellingProducts(params: { sinceDays: number }) {
    const since = new Date();
    since.setDate(since.getDate() - params.sinceDays);
    // products with no sale_items since 'since'
    const { data, error } = await this.client.rpc("not_selling_products", { since_ts: since.toISOString() });
    if (error) throw error;
    return data as any[];
  }
  async getStockValuation() {
    const { data, error } = await this.client.rpc("stock_valuation");
    if (error) throw error;
    return data as any;
  }
  async getProfitMargins(params: { sinceDays: number }) {
    const since = new Date();
    since.setDate(since.getDate() - params.sinceDays);
    const { data, error } = await this.client.rpc("profit_margins", { since_ts: since.toISOString() });
    if (error) throw error;
    return data as any;
  }

  // Payments
  async createPayment(payment: any) {
    const { data, error } = await this.client.from("payments").insert(payment).select("*").single();
    if (error) throw error;
    return data as any;
  }
  async updatePayment(id: string, dataPatch: any) {
    const { data, error } = await this.client.from("payments").update(dataPatch).eq("id", id).select("*").maybeSingle();
    if (error) throw error;
    return (data ?? undefined) as any;
  }
}