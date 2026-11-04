import { getSupabaseServer } from "./supabase";
import { type IStorage, type StoreSettings, DEFAULT_STORE_SETTINGS } from "./storage";
import {
  type User,
  type InsertUser,
  type UserSession,
  type Product,

  type InsertProduct,
  type Category,
  type InsertCategory,
  type Sale,
  type InsertSale,
  type Salesperson,
  type InsertSalesperson,
  type StockMovement,
  type InsertStockMovement,
  type Supplier,
  type InsertSupplier,
  type PurchaseOrder,
  type InsertPurchaseOrder,
  type PurchaseOrderItem,
  type InsertPurchaseOrderItem,
  type Customer,
  type InsertCustomer,
} from "@shared/schema";
import { mapUserFromDb, mapUserToDb, mapProductFromDb, mapProductToDb } from "@/lib/db-column-mapper";

let memorySubscriptionExpiryDate: string | null = null;
let memorySubscriptionRate6Months: number | null = null;
let memoryLastPaymentAmount: number | null = null;
let memoryLastPaymentDate: string | null = null;
let memoryLastPaymentMonths: number | null = null;
let memorySubscriptionHistory: any[] | null = null;

export class SupabaseStorage implements IStorage {
  private async sb() {
    const client = await getSupabaseServer();
    if (!client) {
      throw new Error(
        "Supabase not configured. Please check your environment variables:\n" +
          "- SUPABASE_URL should be https://your-project-id.supabase.co\n" +
          "- SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY should be set\n" +
          "Check your .env.local file and restart your development server."
      );
    }
    return client;
  }

  // Salespersons
  async getSalespersons(includeInactive = false): Promise<Salesperson[]> {
    try {
      let query = (await this.sb()).from("salespersons").select("*").order("name", { ascending: true });
      if (!includeInactive) {
        query = query.eq("active", true);
      }
      const { data, error } = await query;
      if (error) {
        console.warn("Salespersons table query error:", error.message);
        return [];
      }
      return (data ?? []) as Salesperson[];
    } catch (err: any) {
      console.warn("Failed to fetch salespersons:", err?.message);
      return [];
    }
  }

  async getSalesperson(id: string): Promise<Salesperson | undefined> {
    const { data, error } = await (await this.sb())
      .from("salespersons")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return (data ?? undefined) as Salesperson | undefined;
  }

  async createSalesperson(salesperson: InsertSalesperson): Promise<Salesperson> {
    const { data, error } = await (await this.sb())
      .from("salespersons")
      .insert(salesperson)
      .select("*")
      .single();
    if (error) throw error;
    return data as Salesperson;
  }

  async updateSalesperson(
    id: string,
    salesperson: Partial<InsertSalesperson>
  ): Promise<Salesperson | undefined> {
    const { data, error } = await (await this.sb())
      .from("salespersons")
      .update(salesperson)
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    return (data ?? undefined) as Salesperson | undefined;
  }

  async getSalespersonSalesCount(id: string): Promise<number> {
    try {
      const sb = await this.sb();
      const { count, error } = await sb
        .from("sales")
        .select("*", { count: "exact", head: true })
        .eq("salesperson_id", id);
      if (error) {
        console.warn("Failed to count sales for salesperson:", error.message);
        return 0;
      }
      return count ?? 0;
    } catch (err: any) {
      console.warn("Error in getSalespersonSalesCount:", err?.message);
      return 0;
    }
  }

  async getSalespersonRecentSales(id: string, limit = 5): Promise<Sale[]> {
    try {
      const sb = await this.sb();
      const { data, error } = await sb
        .from("sales")
        .select("id, invoice_number, total_amount, created_at, customer_name")
        .eq("salesperson_id", id)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) return [];
      return (data ?? []) as any[];
    } catch {
      return [];
    }
  }

  async deleteSalesperson(id: string): Promise<boolean> {
    const salesCount = await this.getSalespersonSalesCount(id);
    if (salesCount > 0) {
      throw new Error(
        `Cannot delete salesperson: this staff member is linked to ${salesCount} sales transaction(s). Please deactivate them instead.`
      );
    }
    const { error } = await (await this.sb())
      .from("salespersons")
      .delete()
      .eq("id", id);
    if (error) throw error;
    return true;
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    const { data, error } = await (await this.sb())
      .from("users")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? (mapUserFromDb(data) as User) : undefined;
  }
  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data, error } = await (await this.sb())
      .from("users")
      .select("*")
      .eq("username", username)
      .maybeSingle();
    if (error) throw error;
    return data ? (mapUserFromDb(data) as User) : undefined;
  }
  async createUser(user: InsertUser): Promise<User> {
    const payload = mapUserToDb(user);
    const { data, error } = await (await this.sb())
      .from("users")
      .insert(payload)
      .select("*")
      .single();
    if (error) throw error;
    return mapUserFromDb(data) as User;
  }
  async updateUser(
    id: string,
    user: Partial<InsertUser>
  ): Promise<User | undefined> {
    const payload = mapUserToDb(user);
    const { data, error } = await (await this.sb())
      .from("users")
      .update(payload)
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    return data ? (mapUserFromDb(data) as User) : undefined;
  }
  async getUserSalesCount(userId: string): Promise<number> {
    try {
      const sb = await this.sb();
      const { count, error } = await sb
        .from("sales")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);
      if (error) return 0;
      return count ?? 0;
    } catch {
      return 0;
    }
  }

  async getUserRecentSales(userId: string, limit = 6): Promise<Sale[]> {
    try {
      const sb = await this.sb();
      const { data, error } = await sb
        .from("sales")
        .select("id, invoice_number, total_amount, created_at, customer_name")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) return [];
      return (data ?? []) as any[];
    } catch {
      return [];
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    const salesCount = await this.getUserSalesCount(id);
    if (salesCount > 0) {
      throw new Error(
        `Cannot delete user: this user recorded ${salesCount} sales transaction(s). Deactivate or change their role instead.`
      );
    }
    const { error } = await (await this.sb()).from("users").delete().eq("id", id);
    if (error) throw error;
    return true;
  }
  async getUsers(): Promise<User[]> {
    const { data, error } = await (await this.sb()).from("users").select("*");
    if (error) throw error;
    return (data ?? []).map((row) => mapUserFromDb(row) as User);
  }

  // User Sessions & Active Devices
  private memorySessions: Map<string, UserSession> = new Map();
  private lastDbSyncMap: Map<string, number> = new Map();


  async getUserSessions(userId: string): Promise<UserSession[]> {
    try {
      const sb = await this.sb();
      const { data, error } = await sb
        .from("user_sessions")
        .select("*")
        .eq("user_id", userId)
        .order("last_active_at", { ascending: false });

      if (error) {
        console.warn("user_sessions query warning (using in-memory fallback):", error.message);
        return Array.from(this.memorySessions.values()).filter((s) => s.userId === userId && !s.revokedAt);
      }

      const dbSessions: UserSession[] = (data ?? []).map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        sessionToken: row.session_token,
        deviceName: row.device_name,
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        createdAt: row.created_at ? new Date(row.created_at) : null,
        lastActiveAt: row.last_active_at ? new Date(row.last_active_at) : null,
        lastApiActivityAt: row.last_api_activity_at ? new Date(row.last_api_activity_at) : null,
        lastHeartbeatAt: row.last_heartbeat_at ? new Date(row.last_heartbeat_at) : null,
        revokedAt: row.revoked_at ? new Date(row.revoked_at) : null,
        revocationReason: row.revocation_reason || null,
        posStatus: row.pos_status || "ONLINE",
        currentPosOperation: row.current_pos_operation || null,
      }));

      const sessionMap = new Map<string, UserSession>();
      for (const s of dbSessions) {
        sessionMap.set(s.sessionToken, s);
      }
      for (const [token, memSess] of Array.from(this.memorySessions.entries())) {
        if (memSess.userId === userId && !sessionMap.has(token)) {
          sessionMap.set(token, memSess);
        }
      }

      return Array.from(sessionMap.values()).sort(
        (a, b) => (b.lastActiveAt?.getTime() ?? 0) - (a.lastActiveAt?.getTime() ?? 0)
      );
    } catch (err: any) {
      console.warn("Failed to get user sessions from DB, returning memory sessions:", err?.message);
      return Array.from(this.memorySessions.values()).filter((s) => s.userId === userId && !s.revokedAt);
    }
  }

  async createUserSession(params: {
    userId: string;
    sessionToken: string;
    deviceName: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<UserSession> {
    const now = new Date();
    const newSession: UserSession = {
      id: crypto.randomUUID(),
      userId: params.userId,
      sessionToken: params.sessionToken,
      deviceName: params.deviceName,
      ipAddress: params.ipAddress || null,
      userAgent: params.userAgent || null,
      createdAt: now,
      lastActiveAt: now,
      lastApiActivityAt: now,
      lastHeartbeatAt: now,
      revokedAt: null,
      revocationReason: null,
      posStatus: "ONLINE",
      currentPosOperation: null,
    };

    this.memorySessions.set(newSession.sessionToken, newSession);

    try {
      const sb = await this.sb();
      const { data, error } = await sb
        .from("user_sessions")
        .insert({
          id: newSession.id,
          user_id: params.userId,
          session_token: params.sessionToken,
          device_name: params.deviceName,
          ip_address: params.ipAddress || null,
          user_agent: params.userAgent || null,
          created_at: newSession.createdAt,
          last_active_at: newSession.lastActiveAt,
          last_api_activity_at: newSession.lastApiActivityAt,
          last_heartbeat_at: newSession.lastHeartbeatAt,
          pos_status: "ONLINE",
        })
        .select("*")
        .maybeSingle();

      if (error) {
        console.warn("user_sessions insert warning (stored in memory fallback):", error.message);
        return newSession;
      }

      if (data) {
        return {
          id: data.id,
          userId: data.user_id,
          sessionToken: data.session_token,
          deviceName: data.device_name,
          ipAddress: data.ip_address,
          userAgent: data.user_agent,
          createdAt: data.created_at ? new Date(data.created_at) : null,
          lastActiveAt: data.last_active_at ? new Date(data.last_active_at) : null,
          lastApiActivityAt: data.last_api_activity_at ? new Date(data.last_api_activity_at) : null,
          lastHeartbeatAt: data.last_heartbeat_at ? new Date(data.last_heartbeat_at) : null,
          revokedAt: data.revoked_at ? new Date(data.revoked_at) : null,
          revocationReason: data.revocation_reason || null,
          posStatus: data.pos_status || "ONLINE",
          currentPosOperation: data.current_pos_operation || null,
        };
      }
    } catch (err: any) {
      console.warn("Failed to create user session in Supabase, stored in memory:", err?.message);
    }

    return newSession;
  }

  async touchUserSession(sessionToken: string): Promise<void> {
    return this.updateApiActivity(sessionToken);
  }

  async updateHeartbeat(
    sessionToken: string,
    isBusy?: boolean,
    currentOperation?: string
  ): Promise<boolean> {
    const now = new Date();
    const nowMs = now.getTime();
    const mem = this.memorySessions.get(sessionToken);

    let status = "ONLINE";
    let operation: string | null = null;

    if (isBusy !== undefined) {
      status = isBusy ? "BUSY" : "ONLINE";
      operation = isBusy ? (currentOperation || "POS Operation in Progress") : null;
    } else if (mem) {
      status = mem.posStatus || "ONLINE";
      operation = mem.currentPosOperation || null;
    }

    if (mem) {
      mem.lastHeartbeatAt = now;
      mem.lastActiveAt = now;
      mem.posStatus = status;
      mem.currentPosOperation = operation;
    }

    const lastSyncMs = this.lastDbSyncMap.get(sessionToken) || 0;
    const isStateChange = isBusy !== undefined;
    const isPeriodicDbSyncNeeded = nowMs - lastSyncMs > 3 * 60 * 1000; // 3 mins

    // Only query Supabase DB if POS state changed (BUSY/ONLINE) or 3 minutes passed
    if (isStateChange || isPeriodicDbSyncNeeded) {
      this.lastDbSyncMap.set(sessionToken, nowMs);
      try {
        const sb = await this.sb();
        await sb
          .from("user_sessions")
          .update({
            last_heartbeat_at: now,
            last_active_at: now,
            pos_status: status,
            current_pos_operation: operation,
          })
          .eq("session_token", sessionToken);
      } catch (err: any) {
        console.warn("Failed to update heartbeat in DB:", err?.message);
      }
    }

    return true;
  }

  async updateApiActivity(sessionToken: string): Promise<void> {
    const now = new Date();
    const nowMs = now.getTime();
    const mem = this.memorySessions.get(sessionToken);
    if (mem) {
      mem.lastActiveAt = now;
      mem.lastApiActivityAt = now;
    }

    const lastSyncMs = this.lastDbSyncMap.get(sessionToken) || 0;
    if (nowMs - lastSyncMs > 3 * 60 * 1000) {
      this.lastDbSyncMap.set(sessionToken, nowMs);
      try {
        const sb = await this.sb();
        await sb
          .from("user_sessions")
          .update({ last_active_at: now, last_api_activity_at: now })
          .eq("session_token", sessionToken);
      } catch {
        // Ignore background write error
      }
    }
  }

  async cleanupOldRevokedSessions(days = 30): Promise<void> {
    try {
      const threshold = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const sb = await this.sb();
      await sb
        .from("user_sessions")
        .delete()
        .lt("revoked_at", threshold.toISOString());
    } catch {
      // Ignore cleanup error
    }
  }


  async revokeSession(sessionIdOrToken: string, reason?: string, userId?: string): Promise<boolean> {
    const now = new Date();
    const defaultReason = reason || "Revoked by user request";

    for (const [token, sess] of Array.from(this.memorySessions.entries())) {
      if (sess.id === sessionIdOrToken || token === sessionIdOrToken) {
        sess.revokedAt = now;
        sess.revocationReason = defaultReason;
        sess.posStatus = "REVOKED";
        this.memorySessions.delete(token);
      }
    }

    try {
      const sb = await this.sb();
      let query = sb
        .from("user_sessions")
        .update({
          revoked_at: now,
          revocation_reason: defaultReason,
          pos_status: "REVOKED",
        });

      if (sessionIdOrToken.includes("-") && sessionIdOrToken.length >= 32) {
        query = query.or(`id.eq.${sessionIdOrToken},session_token.eq.${sessionIdOrToken}`);
      } else {
        query = query.eq("session_token", sessionIdOrToken);
      }
      if (userId) {
        query = query.eq("user_id", userId);
      }
      await query;
      return true;
    } catch (err: any) {
      console.warn("Failed to revoke user session in DB:", err?.message);
      return true;
    }
  }

  async revokeAllUserSessions(userId: string, reason?: string, exceptToken?: string): Promise<boolean> {
    const now = new Date();
    const defaultReason = reason || "All user sessions revoked";

    for (const [token, sess] of Array.from(this.memorySessions.entries())) {
      if (sess.userId === userId && token !== exceptToken) {
        sess.revokedAt = now;
        sess.revocationReason = defaultReason;
        sess.posStatus = "REVOKED";
        this.memorySessions.delete(token);
      }
    }

    try {
      const sb = await this.sb();
      let query = sb
        .from("user_sessions")
        .update({
          revoked_at: now,
          revocation_reason: defaultReason,
          pos_status: "REVOKED",
        })
        .eq("user_id", userId);

      if (exceptToken) {
        query = query.neq("session_token", exceptToken);
      }
      await query;
      return true;
    } catch (err: any) {
      console.warn("Failed to revoke all user sessions:", err?.message);
      return true;
    }
  }

  async deleteUserSession(sessionIdOrToken: string, userId?: string): Promise<boolean> {
    return this.revokeSession(sessionIdOrToken, "Logged out", userId);
  }

  async deleteAllOtherUserSessions(userId: string, currentSessionToken: string): Promise<boolean> {
    return this.revokeAllUserSessions(userId, "Logged out all other devices", currentSessionToken);
  }



  // Categories
  async getCategories(): Promise<Category[]> {
    const { data, error } = await (await this.sb()).from("categories").select("*");
    if (error) throw error;
    return data as Category[];
  }
  async createCategory(category: InsertCategory): Promise<Category> {
    const payload = {
      id: crypto.randomUUID(), // 🔥 add this (very important)
      name: category.name,
      description: category.description ?? null,
      color: category.color ?? "white",
    };

    const { data, error } = await (await this.sb())
      .from("categories")
      .insert(payload)
      .select("*")
      .single();

    if (error) throw error;
    return data as Category;
  }

  async updateCategory(
    id: string,
    category: Partial<InsertCategory>
  ): Promise<Category | undefined> {
    const payload: any = {
      ...category,
    };

    if (category.color === undefined) delete payload.color;

    const { data, error } = await (await this.sb())
      .from("categories")
      .update(payload)
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error) throw error;
    return data ?? undefined;
  }

  async deleteCategory(id: string): Promise<boolean> {
    const sb = await this.sb();

    // 1) Disassociate soft-deleted products so they don't block deletion
    try {
      await sb
        .from("products")
        .update({ category_id: null })
        .eq("category_id", id);
    } catch (err: any) {
      console.warn("Could not unassign category from products:", err?.message);
    }

    // 2) Remove any promotion targets linked to this category
    try {
      await sb
        .from("promotion_targets")
        .delete()
        .eq("target_type", "category")
        .eq("target_id", id);
    } catch (err: any) {
      // Ignore if table/constraint not present
    }

    // 3) Delete category record
    const { error } = await sb
      .from("categories")
      .delete()
      .eq("id", id);
    if (error) throw error;
    return true;
  }

  // Products
  async getProducts(includeDeleted?: boolean): Promise<Product[]> {
    let query = (await this.sb()).from("products").select("*");

    if (!includeDeleted) {
      query = query.eq("deleted", false);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map(mapProductFromDb) as Product[];
  }
  async getProduct(id: string): Promise<Product | undefined> {
    const { data, error } = await (await this.sb())
      .from("products")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? (mapProductFromDb(data) as Product) : undefined;
  }
  async getProductBySku(sku: string): Promise<Product | undefined> {
    const { data, error } = await (await this.sb())
      .from("products")
      .select("*")
      .eq("sku", sku)
      .maybeSingle();
    if (error) throw error;
    return data ? (mapProductFromDb(data) as Product) : undefined;
  }
  async getProductByBarcode(barcode: string): Promise<Product | undefined> {
    const { data, error } = await (await this.sb())
      .from("products")
      .select("*")
      .eq("barcode", barcode)
      .maybeSingle();
    if (error) throw error;
    return data ? (mapProductFromDb(data) as Product) : undefined;
  }
  async createProduct(product: InsertProduct): Promise<Product> {
    const payload = mapProductToDb(product);
    const { data, error } = await (await this.sb())
      .from("products")
      .insert(payload)
      .select("*")
      .single();
    if (error) throw error;
    return mapProductFromDb(data) as Product;
  }
  async updateProduct(
    id: string,
    product: Partial<InsertProduct>
  ): Promise<Product | undefined> {
    const payload = mapProductToDb(product);
    const { data, error } = await (await this.sb())
      .from("products")
      .update(payload)
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    return data ? (mapProductFromDb(data) as Product) : undefined;
  }
  async getProductSalesCount(productId: string): Promise<number> {
    try {
      const sb = await this.sb();
      const { count, error } = await sb
        .from("sale_items")
        .select("id", { count: "exact", head: true })
        .eq("product_id", productId);
      if (error) return 0;
      return count ?? 0;
    } catch {
      return 0;
    }
  }

  async getProductRecentSales(
    productId: string,
    limit = 6
  ): Promise<
    Array<{
      id: string;
      invoiceNumber: string;
      amount: string;
      quantity: number;
      customerName?: string;
      createdAt?: string;
    }>
  > {
    try {
      const sb = await this.sb();
      const { data: items, error: itemsErr } = await sb
        .from("sale_items")
        .select("sale_id, quantity, created_at")
        .eq("product_id", productId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (itemsErr || !items || items.length === 0) return [];

      const saleIds = Array.from(new Set(items.map((i) => i.sale_id).filter(Boolean)));
      if (saleIds.length === 0) return [];

      const { data: sales, error: salesErr } = await sb
        .from("sales")
        .select("id, invoice_number, total_amount, customer_name, created_at")
        .in("id", saleIds);

      if (salesErr || !sales) return [];

      const salesMap = new Map(sales.map((s) => [s.id, s]));

      return items
        .map((item) => {
          const sale = salesMap.get(item.sale_id);
          if (!sale) return null;
          return {
            id: sale.id,
            invoiceNumber: sale.invoice_number,
            amount: sale.total_amount,
            quantity: item.quantity,
            customerName: sale.customer_name,
            createdAt: item.created_at || sale.created_at,
          };
        })
        .filter(Boolean) as any[];
    } catch {
      return [];
    }
  }

  async deleteProduct(id: string): Promise<boolean> {
    const salesCount = await this.getProductSalesCount(id);
    if (salesCount > 0) {
      throw new Error(
        `Cannot permanently delete product: this item is connected to ${salesCount} sales transaction(s). Keep it in trash to protect sales history.`
      );
    }

    const sb = await this.sb();

    // 1) Remove non-sales dependent rows that reference this product
    const { error: smErr } = await sb
      .from("stock_movements")
      .delete()
      .eq("product_id", id);
    if (smErr) throw smErr;

    const { error: spErr } = await sb
      .from("supplier_products")
      .delete()
      .eq("product_id", id);
    if (spErr) throw spErr;

    const { error: poiErr } = await sb
      .from("purchase_order_items")
      .delete()
      .eq("product_id", id);
    if (poiErr) throw poiErr;

    const { error: pchErr } = await sb
      .from("product_cost_history")
      .delete()
      .eq("product_id", id);
    if (pchErr) throw pchErr;

    const { error: pphErr } = await sb
      .from("product_price_history")
      .delete()
      .eq("product_id", id);
    if (pphErr) throw pphErr;

    const { error: promoErr } = await sb
      .from("promotion_targets")
      .delete()
      .eq("target_type", "product")
      .eq("target_id", id);
    if (promoErr) throw promoErr;

    // 2) Finally delete the product row
    const { error: prodErr } = await sb.from("products").delete().eq("id", id);
    if (prodErr) throw prodErr;
    return true;
  }
  async softDeleteProduct(id: string): Promise<boolean> {
    // Use snake_case column name to match Supabase schema cache
    const { error } = await (await this.sb())
      .from("products")
      .update({ deleted: true, deleted_at: new Date().toISOString() as any })
      .eq("id", id);
    if (error) throw error;
    return true;
  }
  async restoreProduct(id: string): Promise<boolean> {
    // Use snake_case for deleted_at when restoring as well
    const { error } = await (await this.sb())
      .from("products")
      .update({ deleted: false, deleted_at: null as any })
      .eq("id", id);
    if (error) throw error;
    return true;
  }
  async updateStock(
    id: string,
    quantity: number
  ): Promise<Product | undefined> {
    const { data, error } = await (await this.sb())
      .from("products")
      .update({ stock: quantity })
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    return (data ?? undefined) as Product | undefined;
  }

  // Sales
  async getSales(includeDeleted: boolean = false): Promise<Sale[]> {
    const pageSize = 1000;
    let offset = 0;
    const allRows: Sale[] = [];

    while (true) {
      let query = (await this.sb()).from("sales").select("*");
      if (!includeDeleted) {
        query = query.eq("deleted", false);
      }

      const { data, error } = await query
        .order("created_at", { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (error) throw error;
      if (!data || data.length === 0) break;

      allRows.push(...(data as Sale[]));
      if (data.length < pageSize) break;
      offset += pageSize;
    }

    return allRows;
  }
  // storage.ts (update this method)
  async getSalesFiltered(params: {
    userId?: string | null;
    limit: number;
    cursor?: string | null;
    deleted?: boolean;
    payment?: string | null;
    salesperson?: string | null;
    category?: string | null;
    product?: string | null;
    start?: string | null;
    end?: string | null;
    search?: string | null;
    searchBy?: string;
  }) {
    const {
      userId,
      limit,
      cursor,
      deleted,
      payment,
      salesperson,
      category,
      product,
      start,
      end,
      search,
      searchBy,
    } = params;

    let query = (await this.sb()).from("sales").select("*");

    if (userId) query = query.eq("user_id", userId);

    if (deleted !== undefined) query = query.eq("deleted", deleted);

    if (payment) query = query.ilike("payment_method", payment);

    if (salesperson) {
      if (salesperson === "unassigned") {
        query = query.is("salesperson_id", null);
      } else {
        query = query.or(`salesperson_id.eq.${salesperson},salesperson_name.ilike.%${salesperson}%`);
      }
    }

    if (start) query = query.gte("created_at", start);
    if (end) query = query.lte("created_at", end);

    if (product) query = query.contains("items", [{ productId: product }]);

    if (category) query = query.contains("items", [{ category }]);

    // ✔ SAFE MULTI-FIELD SEARCH (NO ::text)
    // ✔ SEARCH WITH SEARCH-BY CONTROL
    if (search && searchBy) {
      const isNumeric = !isNaN(Number(search));
      let orParts: string[] = [];

      switch (searchBy) {
        case "invoice":
          orParts.push(`invoice_number.ilike.%${search}%`);
          break;

        case "name":
          orParts.push(`customer_name.ilike.%${search}%`);
          break;

        case "phone":
          orParts.push(`customer_phone.ilike.%${search}%`);
          break;

        case "payment":
          orParts.push(`payment_method.ilike.%${search}%`);
          break;

        case "amount":
          if (isNumeric) orParts.push(`total_amount.eq.${Number(search)}`);
          break;

        case "all":
        default:
          orParts = [
            `invoice_number.ilike.%${search}%`,
            `payment_method.ilike.%${search}%`,
            `customer_name.ilike.%${search}%`,
            `customer_phone.ilike.%${search}%`,
          ];
          if (isNumeric) {
            orParts.push(`total_amount.eq.${Number(search)}`);
          }
          break;
      }

      if (orParts.length > 0) {
        query = query.or(orParts.join(","));
      }
    }

    if (cursor) query = query.lt("created_at", cursor);

    query = query.order("created_at", { ascending: false }).limit(limit + 1);

    let { data, error } = await query;
    if (error && (error.code === "42703" || error.message?.includes("salesperson_id") || error.message?.includes("salesperson_name"))) {
      console.warn("salesperson columns missing on sales table during query, retrying without salesperson filter:", error.message);
      let fallbackQuery = (await this.sb()).from("sales").select("*");
      if (userId) fallbackQuery = fallbackQuery.eq("user_id", userId);
      if (deleted !== undefined) fallbackQuery = fallbackQuery.eq("deleted", deleted);
      if (payment) fallbackQuery = fallbackQuery.ilike("payment_method", payment);
      if (start) fallbackQuery = fallbackQuery.gte("created_at", start);
      if (end) fallbackQuery = fallbackQuery.lte("created_at", end);
      if (product) fallbackQuery = fallbackQuery.contains("items", [{ productId: product }]);
      if (category) fallbackQuery = fallbackQuery.contains("items", [{ category }]);
      if (cursor) fallbackQuery = fallbackQuery.lt("created_at", cursor);
      fallbackQuery = fallbackQuery.order("created_at", { ascending: false }).limit(limit + 1);
      const res = await fallbackQuery;
      data = res.data;
      error = res.error;
    }
    if (error) throw error;

    const hasMore = (data || []).length > limit;
    const result = hasMore ? (data || []).slice(0, limit) : (data || []);

    return {
      data: result,
      nextCursor: hasMore ? result[result.length - 1].created_at : null,
    };
  }

  public async querySalesTable() {
    return (await this.sb()).from("sales");
  }

  async getSalesByUser(
    userId: string,
    includeDeleted: boolean = false
  ): Promise<Sale[]> {
    const pageSize = 1000;
    let offset = 0;
    const allRows: Sale[] = [];

    while (true) {
      let query = (await this.sb())
        .from("sales")
        .select("*")
        .eq("user_id", userId);
      if (!includeDeleted) {
        query = query.eq("deleted", false);
      }

      const { data, error } = await query
        .order("created_at", { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (error) throw error;
      if (!data || data.length === 0) break;

      allRows.push(...(data as Sale[]));
      if (data.length < pageSize) break;
      offset += pageSize;
    }

    return allRows;
  }
  async getSalesToday(): Promise<Sale[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { data, error } = await (await this.sb())
      .from("sales")
      .select("*")
      .gte("created_at", today.toISOString())
      .eq("deleted", false) // Exclude deleted sales
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as Sale[];
  }
  async createSale(sale: InsertSale): Promise<Sale> {
    const sb = await this.sb();
    let validUserId = sale.user_id;

    // Verify if validUserId exists in users table to prevent FK constraint error
    const { data: userExists } = await sb
      .from("users")
      .select("id")
      .eq("id", validUserId)
      .maybeSingle();

    if (!userExists) {
      // Find first user in users table
      const { data: firstUser } = await sb
        .from("users")
        .select("id")
        .limit(1)
        .maybeSingle();

      if (firstUser?.id) {
        validUserId = firstUser.id;
      } else {
        // Create default admin user if users table is empty
        const { data: createdAdmin } = await sb
          .from("users")
          .insert({
            id: validUserId,
            username: "admin",
            password: "password",
            role: "admin",
            full_name: "Super Admin",
          })
          .select("id")
          .single();
        if (createdAdmin?.id) validUserId = createdAdmin.id;
      }
    }

    const payload: any = {
      user_id: validUserId,
      customer_id: (sale as any).customer_id || null,
      customer_name: sale.customer_name?.trim() || "Walk-in Customer",
      customer_phone: sale.customer_phone?.trim() || "N/A",
      items: sale.items,
      invoice_number: sale.invoice_number,
      subtotal: parseFloat(sale.subtotal || "0").toFixed(2),
      tax_percent: parseFloat(sale.tax_percent || "0").toFixed(2),
      tax_amount: parseFloat(sale.tax_amount || "0").toFixed(2),
      discount_type: sale.discount_type || null,
      discount_value: parseFloat(sale.discount_value || "0").toFixed(2),
      discount_amount: parseFloat(sale.discount_amount || "0").toFixed(2),
      total_amount: parseFloat(sale.total_amount || "0").toFixed(2),
      payment_method: sale.payment_method || "cash",
      salesperson_id: (sale as any).salesperson_id || null,
      salesperson_name: (sale as any).salesperson_name || null,
    };
    let { data, error } = await sb
      .from("sales")
      .insert(payload)
      .select("*")
      .single();
    if (
      error &&
      (error.code === "42703" ||
        error.code === "PGRST204" ||
        error.message?.includes("salesperson_id") ||
        error.message?.includes("salesperson_name") ||
        error.message?.includes("customer_id"))
    ) {
      console.warn("Retrying sale insert without optional columns:", error.message);
      if (error.message?.includes("salesperson_id") || error.message?.includes("salesperson_name")) {
        delete payload.salesperson_id;
        delete payload.salesperson_name;
      }
      if (error.message?.includes("customer_id")) {
        delete payload.customer_id;
      }
      const fallback = await sb
        .from("sales")
        .insert(payload)
        .select("*")
        .single();
      data = fallback.data;
      error = fallback.error;
    }
    if (error) throw error;
    if (data) {
      this.syncCustomerStats({
        customerId: data.customer_id,
        customerPhone: data.customer_phone,
      }).catch((e) => console.warn("Background customer stats sync error:", e));
    }
    return data as Sale;
  }
  async softDeleteSale(saleId: string): Promise<boolean> {
    const sb = await this.sb();
    const { data: targetSale } = await sb.from("sales").select("customer_id, customer_phone").eq("id", saleId).maybeSingle();
    const { error } = await sb
      .from("sales")
      .update({ deleted: true, deleted_at: new Date().toISOString() as any })
      .eq("id", saleId);
    if (error) throw error;
    if (targetSale) {
      this.syncCustomerStats({ customerId: targetSale.customer_id, customerPhone: targetSale.customer_phone }).catch(() => {});
    }
    return true;
  }
  async restoreSale(saleId: string): Promise<boolean> {
    const sb = await this.sb();
    const { data: targetSale } = await sb.from("sales").select("customer_id, customer_phone").eq("id", saleId).maybeSingle();
    const { error } = await sb
      .from("sales")
      .update({ deleted: false, deleted_at: null as any })
      .eq("id", saleId);
    if (error) throw error;
    if (targetSale) {
      this.syncCustomerStats({ customerId: targetSale.customer_id, customerPhone: targetSale.customer_phone }).catch(() => {});
    }
    return true;
  }
  async deleteSale(saleId: string): Promise<boolean> {
    const sb = (await this.sb());

    // Clean up dependent records before deleting the sale row to avoid FK constraints
    // 1) Load any sales returns linked to this sale so we can cascade delete their items
    const { data: salesReturns, error: salesReturnFetchError } = await sb
      .from("sales_returns")
      .select("id")
      .eq("sale_id", saleId);
    if (salesReturnFetchError) throw salesReturnFetchError;

    const salesReturnIds = (salesReturns || []).map((sr: any) => sr.id);

    if (salesReturnIds.length > 0) {
      const { error: stockFromReturnsError } = await sb
        .from("stock_movements")
        .delete()
        .eq("ref_table", "sales_return_items")
        .in("ref_id", salesReturnIds as any);
      if (stockFromReturnsError) throw stockFromReturnsError;

      const { error: salesReturnItemsDeleteError } = await sb
        .from("sales_return_items")
        .delete()
        .in("sales_return_id", salesReturnIds as any);
      if (salesReturnItemsDeleteError) throw salesReturnItemsDeleteError;

      const { error: salesReturnsDeleteError } = await sb
        .from("sales_returns")
        .delete()
        .in("id", salesReturnIds as any);
      if (salesReturnsDeleteError) throw salesReturnsDeleteError;
    }

    // 2) Remove stock movements created for the sale itself
    const { error: stockMovementsError } = await sb
      .from("stock_movements")
      .delete()
      .eq("ref_table", "sale_items")
      .eq("ref_id", saleId);
    if (stockMovementsError) throw stockMovementsError;

    // 3) Delete sale items (returns already removed above)
    const { error: saleItemsError } = await sb
      .from("sale_items")
      .delete()
      .eq("sale_id", saleId);
    if (saleItemsError) throw saleItemsError;

    // 4) Delete any payments tied to this sale
    const { error: paymentsError } = await sb
      .from("payments")
      .delete()
      .eq("sale_id", saleId);
    if (paymentsError) throw paymentsError;

    // 5) Fetch target sale customer before deleting sale row
    const { data: targetSale } = await sb.from("sales").select("customer_id, customer_phone").eq("id", saleId).maybeSingle();

    // 6) Finally delete the sale row
    const { error: saleDeleteError } = await sb
      .from("sales")
      .delete()
      .eq("id", saleId);
    if (saleDeleteError) throw saleDeleteError;

    if (targetSale) {
      this.syncCustomerStats({ customerId: targetSale.customer_id, customerPhone: targetSale.customer_phone }).catch(() => {});
    }

    return true;
  }

  // Stock Movements
  async getStockMovements(): Promise<StockMovement[]> {
    const { data, error } = await (await this.sb())
      .from("stock_movements")
      .select("*");
    if (error) throw error;
    return data as StockMovement[];
  }
  async getStockMovementsByProduct(
    productId: string
  ): Promise<StockMovement[]> {
    const { data, error } = await (await this.sb())
      .from("stock_movements")
      .select("*")
      .eq("product_id", productId);
    if (error) throw error;
    return data as StockMovement[];
  }
  async createStockMovement(
    movement: InsertStockMovement
  ): Promise<StockMovement> {
    const payload: any = {
      product_id: (movement as any).productId,
      user_id: (movement as any).userId,
      type: (movement as any).type,
      quantity: (movement as any).quantity,
      reason: (movement as any).reason,
      ref_table: (movement as any).refTable,
      ref_id: (movement as any).refId,
    };
    const { data, error } = await (await this.sb())
      .from("stock_movements")
      .insert(payload)
      .select("*")
      .single();
    if (error) throw error;
    return data as StockMovement;
  }

  // Suppliers
  async getSuppliers(): Promise<Supplier[]> {
    const { data, error } = await (await this.sb()).from("suppliers").select("*");
    if (error) throw error;
    return data as Supplier[];
  }
  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    const { data, error } = await (await this.sb())
      .from("suppliers")
      .insert(supplier)
      .select("*")
      .single();
    if (error) throw error;
    return data as Supplier;
  }

  // Purchase Orders
  async getPurchaseOrders(): Promise<PurchaseOrder[]> {
    const { data, error } = await (await this.sb())
      .from("purchase_orders")
      .select("*");
    if (error) throw error;
    return data as PurchaseOrder[];
  }
  async createPurchaseOrder(po: InsertPurchaseOrder): Promise<PurchaseOrder> {
    const { data, error } = await (await this.sb())
      .from("purchase_orders")
      .insert(po)
      .select("*")
      .single();
    if (error) throw error;
    return data as PurchaseOrder;
  }
  async addPurchaseOrderItem(
    item: InsertPurchaseOrderItem
  ): Promise<PurchaseOrderItem> {
    const { data, error } = await (await this.sb())
      .from("purchase_order_items")
      .insert(item)
      .select("*")
      .single();
    if (error) throw error;
    return data as PurchaseOrderItem;
  }
  async receivePurchaseOrderItems(params: {
    items: Array<{ purchaseOrderItemId: string; quantity: number }>;
    userId: string;
  }): Promise<void> {
    const { items, userId } = params;
    const sb = (await this.sb());
    const txn = sb; // Supabase PostgREST cannot do multi-step tx in one call; perform sequentially.

    for (const item of items) {
      // 1) Load PO item with product and unitCost
      const { data: poi, error: poiErr } = await txn
        .from("purchase_order_items")
        .select(
          "id, productId:product_id, unitCost:unit_cost, quantityReceived:quantity_received"
        )
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
      const { error: moveErr } = await txn.from("stock_movements").insert({
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
      const { error: costErr } = await txn.from("product_cost_history").insert({
        product_id: poi.productId,
        cost: poi.unitCost,
        source: "PO",
      } as any);
      if (costErr) throw costErr;
    }
  }

  // Sales normalization & Returns
  async createSaleItems(
    saleId: string,
    items: Array<{
      productId: string;
      quantity: number;
      price: string;
      name: string;
      sku: string;
    }>
  ): Promise<void> {
    for (const it of items) {
      const { error } = await (await this.sb()).from("sale_items").insert({
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

  // FILE: src/server/storage/createSalesReturn.ts

  async createSalesReturn(params: {
    saleId: string;
    customerId?: string;
    reason?: string;
    items: Array<{
      productId: string;
      saleItemId?: string;
      quantity: number;
      refundAmount?: string;
    }>;
    userId: string;
  }): Promise<{ salesReturnId: string }> {
    const { saleId, customerId, reason, items, userId } = params;

    console.log("Creating sales return for sale:", saleId);

    // ---------------------------------------------
    // 1️⃣ Create sales return header row
    // ---------------------------------------------
    const { data: sr, error: srErr } = await (await this.sb())
      .from("sales_returns")
      .insert({ sale_id: saleId, customer_id: customerId || null, reason })
      .select("id")
      .single();

    if (srErr) throw srErr;

    const returnId = sr.id;
    console.log("Sales return created:", returnId);

    // ---------------------------------------------
    // 2️⃣ Process each returned item
    // ---------------------------------------------
    for (const it of items) {
      let saleItemId = it.saleItemId;

      // STEP A — Find sale_item_id
      if (!saleItemId) {
        const { data: saleItem, error: findErr } = await (await this.sb())
          .from("sale_items")
          .select("id")
          .eq("sale_id", saleId)
          .eq("product_id", it.productId)
          .maybeSingle();

        if (findErr) throw findErr;

        saleItemId = saleItem?.id || null;

        // STEP B — If missing in sale_items table → create from original sale JSON
        if (!saleItemId) {
          const { data: saleData, error: saleErr } = await (await this.sb())
            .from("sales")
            .select("items")
            .eq("id", saleId)
            .single();

          if (saleErr) throw saleErr;

          const parsed = Array.isArray(saleData.items)
            ? saleData.items
            : JSON.parse(saleData.items || "[]");

          const original = parsed.find(
            (x: any) => x.productId === it.productId
          );
          if (!original)
            throw new Error(`Product ${it.productId} not in sale.`);

          const { data: newSaleItem, error: createErr } = await (await this.sb())
            .from("sale_items")
            .insert({
              sale_id: saleId,
              product_id: it.productId,
              quantity: original.quantity,
              price: original.price,
              name: original.name,
              sku: original.sku,
            })
            .select("id")
            .single();

          if (createErr) throw createErr;
          saleItemId = newSaleItem.id;
        }
      }

      // STEP C — Insert into sales_return_items
      const { error: sriErr } = await (await this.sb())
        .from("sales_return_items")
        .insert({
          sales_return_id: returnId,
          sale_item_id: saleItemId,
          product_id: it.productId,
          quantity: it.quantity,
          refund_amount: it.refundAmount ?? null,
        });

      if (sriErr) throw sriErr;

      // STEP D — Restock
      const { data: prod, error: prodErr } = await (await this.sb())
        .from("products")
        .select("stock")
        .eq("id", it.productId)
        .maybeSingle();

      if (prodErr) throw prodErr;

      const newStock = Number(prod?.stock || 0) + it.quantity;

      const { error: updErr } = await (await this.sb())
        .from("products")
        .update({ stock: newStock })
        .eq("id", it.productId);

      if (updErr) throw updErr;

      // STEP E — Log stock movement
      const { error: moveErr } = await (await this.sb())
        .from("stock_movements")
        .insert({
          product_id: it.productId,
          user_id: userId,
          type: "return_in",
          quantity: it.quantity,
          reason: `Sales return for sale ${saleId}`,
          ref_table: "sales_return_items",
          ref_id: returnId,
        });

      if (moveErr) throw moveErr;
    }

    // ---------------------------------------------
    // 3️⃣ Recalculate sale totals
    // ---------------------------------------------
    // console.log("Recalculating totals…");

    const { data: saleMeta, error: saleMetaErr } = await (await this.sb())
      .from("sales")
      .select("items, discount_type, discount_value, tax_percent")
      .eq("id", saleId)
      .single();

    if (saleMetaErr) throw saleMetaErr;

    const originalItems = Array.isArray(saleMeta.items)
      ? saleMeta.items
      : JSON.parse(saleMeta.items || "[]");

    // Reduce quantities from returned items
    for (const ret of items) {
      const idx = originalItems.findIndex(
        (i: any) => i.productId === ret.productId
      );
      if (idx >= 0) {
        originalItems[idx].quantity = Math.max(
          0,
          originalItems[idx].quantity - ret.quantity
        );
      }
    }

    // Remove items with zero quantity
    const updatedItems = originalItems.filter((i: any) => i.quantity > 0);

    // Step 2: NEW subtotal
    let newSubtotal = 0;
    for (const item of updatedItems) {
      newSubtotal += Number(item.price) * Number(item.quantity);
    }

    // Step 3: Discount
    const discountType = saleMeta.discount_type || "none";
    const discountValue = Number(saleMeta.discount_value || 0);

    let discountAmount = 0;

    if (discountType === "percentage") {
      discountAmount = (newSubtotal * discountValue) / 100;
    } else if (discountType === "flat") {
      discountAmount = discountValue;
    }

    // Step 4: TAX
    const taxPercent = Number(saleMeta.tax_percent || 0);
    const taxableAmount = newSubtotal - discountAmount;
    const taxAmount = (taxableAmount * taxPercent) / 100;

    // Step 5: New total
    const newTotal = taxableAmount + taxAmount;

    // ---------------------------------------------
    // 4️⃣ Update sale record
    // ---------------------------------------------
    const { error: finalErr } = await (await this.sb())
      .from("sales")
      .update({
        items: updatedItems,
        subtotal: newSubtotal,
        discount_amount: discountAmount,
        discount_value: discountValue,
        tax_percent: taxPercent,
        tax_amount: taxAmount,
        total_amount: newTotal,
      })
      .eq("id", saleId);

    if (finalErr) throw finalErr;

    // console.log("Sale updated:", {
    //   subtotal: newSubtotal,
    //   discountAmount,
    //   taxAmount,
    //   total_amount: newTotal,
    // });

    return { salesReturnId: returnId };
  }

  // Promotions
  async getPromotions() {
    const { data, error } = await (await this.sb())
      .from("promotions")
      .select("*")
      .eq("active", true);
    if (error) throw error;
    return data as any;
  }
  async createPromotion(promo: any) {
    const { data, error } = await (await this.sb())
      .from("promotions")
      .insert(promo)
      .select("*")
      .single();
    if (error) throw error;
    return data as any;
  }
  async addPromotionTarget(target: any) {
    const { data, error } = await (await this.sb())
      .from("promotion_targets")
      .insert(target)
      .select("*")
      .single();
    if (error) throw error;
    return data as any;
  }
  async getPromotionTargets() {
    const { data, error } = await (await this.sb())
      .from("promotion_targets")
      .select("*");
    if (error) throw error;
    return data as any[];
  }

  // Reports (approximate queries)
  async getNotSellingProducts({
    sinceDays,
    fromDate,
    toDate,
  }: {
    sinceDays: number;
    fromDate?: Date;
    toDate?: Date;
  }) {
    // Determine cutoff date - use fromDate if provided, otherwise calculate from sinceDays
    let cutoffDate: Date;
    if (fromDate) {
      cutoffDate = new Date(fromDate);
    } else {
      cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - sinceDays);
    }

    // 1️⃣ Fetch all products (including delete flags)
    const { data: products, error: productsError } = await (await this.sb())
      .from("products")
      .select("id, name, sku, stock, deleted_at, deleted")
      .order("name", { ascending: true });

    if (productsError) throw productsError;

    // 2️⃣ Fetch sales with product IDs
    // For date range queries, we need to check if products were sold IN the range
    // So we fetch sales within the range to see which products were sold
    // For sinceDays queries, we just need sales after cutoffDate
    let salesQuery = (await this.sb())
      .from("sales")
      .select("created_at, items, deleted")
      .eq("deleted", false);

    if (fromDate && toDate) {
      // For date range: get sales within the range to identify products sold in that period
      salesQuery = salesQuery
        .gte("created_at", fromDate.toISOString())
        .lte("created_at", toDate.toISOString());
    } else {
      // For sinceDays: get sales after cutoffDate
      salesQuery = salesQuery.gte("created_at", cutoffDate.toISOString());
    }

    const { data: sales, error: salesError } = await salesQuery;

    if (salesError) throw salesError;

    // 3️⃣ Compute which products were sold in the period
    // For date range: products sold in the range
    // For sinceDays: products sold since cutoffDate
    const productsSoldInPeriod: Set<string> = new Set();

    for (const sale of sales) {
      try {
        const items = Array.isArray(sale.items)
          ? sale.items
          : JSON.parse(sale.items || "[]");

        for (const item of items) {
          if (!item.productId) continue;
          productsSoldInPeriod.add(item.productId);
        }
      } catch (err) {
        console.error("Error parsing sale items:", err);
      }
    }

    // 4️⃣ Also get last sold date for each product (from all sales) for display
    const { data: allSales, error: allSalesError } = await (await this.sb())
      .from("sales")
      .select("created_at, items, deleted")
      .eq("deleted", false);

    if (allSalesError) throw allSalesError;

    const lastSoldMap: Record<string, string> = {};
    for (const sale of allSales || []) {
      try {
        const items = Array.isArray(sale.items)
          ? sale.items
          : JSON.parse(sale.items || "[]");

        for (const item of items) {
          if (!item.productId) continue;
          const productId = item.productId;
          const saleDate = new Date(sale.created_at);

          if (
            !lastSoldMap[productId] ||
            new Date(lastSoldMap[productId]) < saleDate
          ) {
            lastSoldMap[productId] = saleDate.toISOString();
          }
        }
      } catch (err) {
        console.error("Error parsing sale items:", err);
      }
    }

    // 5️⃣ Filter products not sold in the period
    const notSelling = products
      .filter((p: any) => {
        // Product is "not selling" if it wasn't sold in the period
        const wasSoldInPeriod = productsSoldInPeriod.has(p.id);
        const isDeleted = p.deleted || !!p.deleted_at;

        return !wasSoldInPeriod && !isDeleted;
      })
      .map((p: any) => ({
        productId: p.id,
        name: p.name,
        sku: p.sku,
        stock: p.stock,
        lastSoldAt: lastSoldMap[p.id] || null,
        deleted_at: p.deleted_at,
        isDeleted: p.deleted || false,
      }));

    return notSelling;
  }

  async getStockValuation() {
    const { data: products, error } = await (await this.sb())
      .from("products")
      .select("id, name, stock, price, buying_price, deleted");

    if (error) throw error;

    const validProducts = (products || []).filter((p: any) => !p.deleted);

    let totalValuation = 0;
    let totalCost = 0;

    const byProduct = validProducts.map((p: any) => {
      const stock = Number(p.stock ?? 0);
      const costPrice = Number(p.buying_price ?? 0);
      const sellingPrice = Number(p.price ?? 0);

      const valuation = stock * sellingPrice;
      const totalProductCost = stock * costPrice;

      totalValuation += valuation;
      totalCost += totalProductCost;

      return {
        productId: p.id,
        name: p.name,
        stock,
        costPrice,
        sellingPrice,
        totalCost: totalProductCost,
        valuation,
      };
    });

    // console.log("🧾 Products:", validProducts);
    // console.log("✅ totalCost:", totalCost, "totalValuation:", totalValuation);

    return {
      totalCost,
      totalValuation,
      byProduct,
    };
  }

  /**
   * Profit margins without DB RPC (e.g. new Supabase project where `profit_margins` was never created).
   */
  private async computeProfitMarginsForDateRange(
    fromDate: Date,
    toDateInclusive: Date
  ) {
    const toEnd = new Date(toDateInclusive);
    toEnd.setHours(23, 59, 59, 999);

    const { data: sales, error: salesError } = await (await this.sb())
      .from("sales")
      .select("items, created_at, total_amount, discount_amount")
      .eq("deleted", false)
      .gte("created_at", fromDate.toISOString())
      .lte("created_at", toEnd.toISOString());

    if (salesError) throw salesError;

    const { data: products } = await (await this.sb())
      .from("products")
      .select("id, name, price, buying_price");

    const productMap: Record<string, any> = {};
    for (const p of products || []) {
      productMap[p.id] = p;
    }

    let totalProfit = 0;
    const byProduct: Record<
      string,
      {
        productId: string;
        name: string;
        quantity: number;
        revenue: number;
        cost: number;
        profit: number;
        marginPercent: number;
      }
    > = {};

    for (const sale of sales || []) {
      let items: any[] = [];
      try {
        items = Array.isArray(sale.items)
          ? sale.items
          : JSON.parse((sale.items as string) || "[]");
      } catch {
        continue;
      }

      const discountAmount = Number((sale as any).discount_amount || 0) || 0;
      const subtotal = items.reduce(
        (sum: number, it: any) =>
          sum + Number(it.quantity || 0) * Number(it.price || 0),
        0
      );
      const discountRate =
        subtotal > 0 ? Math.min(discountAmount / subtotal, 1) : 0;

      for (const item of items) {
        const productId = item.productId;
        const product = productMap[productId];
        if (!product) continue;

        const qty = Number(item.quantity || 0);
        const sellingPrice = Number(item.price || 0);
        const costPrice = Number(product.buying_price ?? product.buyingPrice ?? product.price ?? 0);

        const revenue = qty * sellingPrice * (1 - discountRate);
        const cost = qty * costPrice;
        const profit = revenue - cost;

        totalProfit += profit;

        if (!byProduct[productId]) {
          byProduct[productId] = {
            productId,
            name: product.name || "Unknown",
            quantity: 0,
            revenue: 0,
            cost: 0,
            profit: 0,
            marginPercent: 0,
          };
        }

        byProduct[productId].quantity += qty;
        byProduct[productId].revenue += revenue;
        byProduct[productId].cost += cost;
        byProduct[productId].profit += profit;
      }
    }

    for (const key in byProduct) {
      const p = byProduct[key];
      p.marginPercent = p.revenue > 0 ? (p.profit / p.revenue) * 100 : 0;
    }

    return {
      totalProfit,
      byProduct: Object.values(byProduct),
    };
  }

  async getProfitMargins(params: {
    sinceDays: number;
    fromDate?: Date;
    toDate?: Date;
  }) {
    let since: Date;
    if (params.fromDate) {
      since = new Date(params.fromDate);
    } else {
      since = new Date();
      since.setDate(since.getDate() - params.sinceDays);
    }

    const fromRange = params.fromDate
      ? new Date(params.fromDate)
      : (() => {
          const d = new Date();
          d.setDate(d.getDate() - params.sinceDays);
          d.setHours(0, 0, 0, 0);
          return d;
        })();
    const toRange = params.toDate
      ? new Date(params.toDate)
      : (() => {
          const d = new Date();
          d.setHours(23, 59, 59, 999);
          return d;
        })();
    if (params.toDate) {
      toRange.setHours(23, 59, 59, 999);
    }

    const { data, error } = await (await this.sb()).rpc("profit_margins", {
      since_ts: since.toISOString(),
    });

    if (error) {
      return this.computeProfitMarginsForDateRange(fromRange, toRange);
    }

    let result = data as any;

    if (params.fromDate && params.toDate) {
      const toEnd = new Date(params.toDate);
      toEnd.setHours(23, 59, 59, 999);
      result = await this.computeProfitMarginsForDateRange(
        new Date(params.fromDate),
        toEnd
      );
    }

    return result;
  }

  // Payments
  async createPayment(payment: any) {
    const { data, error } = await (await this.sb())
      .from("payments")
      .insert(payment)
      .select("*")
      .single();
    if (error) throw error;
    return data as any;
  }
  async updatePayment(id: string, dataPatch: any) {
    const { data, error } = await (await this.sb())
      .from("payments")
      .update(dataPatch)
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    return (data ?? undefined) as any;
  }

  // Discount Coupons
  async getDiscountCoupons(): Promise<
    import("@shared/schema").DiscountCoupon[]
  > {
    const { data, error } = await (await this.sb())
      .from("discount_coupons")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as import("@shared/schema").DiscountCoupon[];
  }

  async createDiscountCoupon(
    coupon: import("@shared/schema").InsertDiscountCoupon
  ): Promise<import("@shared/schema").DiscountCoupon> {
    // Map camelCase to snake_case for Supabase
    const payload: any = {
      name: (coupon as any).name,
      percentage: (coupon as any).percentage,
      active: (coupon as any).active,
      created_by: (coupon as any).createdBy,
    };
    const { data, error } = await (await this.sb())
      .from("discount_coupons")
      .insert(payload)
      .select("*")
      .single();
    if (error) throw error;
    return data as import("@shared/schema").DiscountCoupon;
  }

  async getDiscountCouponByName(
    name: string
  ): Promise<import("@shared/schema").DiscountCoupon | undefined> {
    const { data, error } = await (await this.sb())
      .from("discount_coupons")
      .select("*")
      .eq("name", name)
      .eq("active", true)
      .maybeSingle();
    if (error) throw error;
    return (data ?? undefined) as
      | import("@shared/schema").DiscountCoupon
      | undefined;
  }

  async updateDiscountCoupon(
    id: string,
    coupon: Partial<import("@shared/schema").InsertDiscountCoupon>
  ): Promise<import("@shared/schema").DiscountCoupon | undefined> {
    const payload: any = {};
    if ((coupon as any).name !== undefined) payload.name = (coupon as any).name;
    if ((coupon as any).percentage !== undefined)
      payload.percentage = (coupon as any).percentage;
    if ((coupon as any).active !== undefined)
      payload.active = (coupon as any).active;
    if ((coupon as any).createdBy !== undefined)
      payload.created_by = (coupon as any).createdBy;
    const { data, error } = await (await this.sb())
      .from("discount_coupons")
      .update(payload)
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    return (data ?? undefined) as
      | import("@shared/schema").DiscountCoupon
      | undefined;
  }

  async deleteDiscountCoupon(id: string): Promise<boolean> {
    const { error } = await (await this.sb())
      .from("discount_coupons")
      .delete()
      .eq("id", id);
    if (error) throw error;
    return true;
  }

  async createBackupLog(entry: {
    status: string;
    fileName?: string | null;
    sizeBytes?: number | null;
    masterStatus?: string | null;
    userStatus?: string | null;
    errors?: any;
  }): Promise<any> {
    try {
      const sb = await this.sb();
      const payload = {
        status: entry.status,
        file_name: entry.fileName || null,
        size_bytes: entry.sizeBytes || 0,
        master_status: entry.masterStatus || null,
        user_status: entry.userStatus || null,
        errors: entry.errors ? JSON.stringify(entry.errors) : null,
      };
      const { data, error } = await sb.from("backup_logs").insert(payload).select("*").maybeSingle();
      if (error) console.warn("createBackupLog note (table backup_logs may need creation in Supabase):", error.message);
      return data;
    } catch (e) {
      console.warn("createBackupLog exception:", e);
      return null;
    }
  }

  async getBackupLogs(limit: number = 50): Promise<any[]> {
    try {
      const sb = await this.sb();
      const { data, error } = await sb
        .from("backup_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) {
        console.warn("getBackupLogs note:", error.message);
        return [];
      }
      return data || [];
    } catch (e) {
      console.warn("getBackupLogs exception:", e);
      return [];
    }
  }

  // Store & Billing Settings
  async getStoreSettings(): Promise<StoreSettings> {
    try {
      const sb = await this.sb();
      const { data, error } = await sb
        .from("store_settings")
        .select("*")
        .eq("id", "default_store")
        .maybeSingle();

      if (!error && data) {
        let history = memorySubscriptionHistory || DEFAULT_STORE_SETTINGS.subscriptionHistory;
        if (data.subscription_history) {
          try {
            history = typeof data.subscription_history === "string" ? JSON.parse(data.subscription_history) : data.subscription_history;
          } catch {}
        }

        return {
          id: data.id || "default_store",
          storeName: data.store_name || DEFAULT_STORE_SETTINGS.storeName,
          address: data.address || DEFAULT_STORE_SETTINGS.address,
          phone: data.phone || DEFAULT_STORE_SETTINGS.phone,
          email: data.email ?? DEFAULT_STORE_SETTINGS.email,
          gstNumber: data.gst_number ?? DEFAULT_STORE_SETTINGS.gstNumber,
          tagline: data.tagline || DEFAULT_STORE_SETTINGS.tagline,
          receiptFooter: data.receipt_footer || DEFAULT_STORE_SETTINGS.receiptFooter,
          taxEnabled: data.tax_enabled ?? DEFAULT_STORE_SETTINGS.taxEnabled,
          taxPercent: data.tax_percent !== undefined && data.tax_percent !== null ? parseFloat(data.tax_percent) : DEFAULT_STORE_SETTINGS.taxPercent,
          taxLabel: data.tax_label || DEFAULT_STORE_SETTINGS.taxLabel,
          taxInclusive: data.tax_inclusive ?? DEFAULT_STORE_SETTINGS.taxInclusive,
          showSalespersonOnBill: data.show_salesperson_on_bill ?? DEFAULT_STORE_SETTINGS.showSalespersonOnBill,
          whatsappTemplate: data.whatsapp_template || DEFAULT_STORE_SETTINGS.whatsappTemplate,
          instagram: data.instagram ?? DEFAULT_STORE_SETTINGS.instagram,
          whatsappNumber: data.whatsapp_number ?? DEFAULT_STORE_SETTINGS.whatsappNumber,
          subscriptionExpiryDate: data.subscription_expiry_date || memorySubscriptionExpiryDate || DEFAULT_STORE_SETTINGS.subscriptionExpiryDate,
          subscriptionRate6Months: data.subscription_rate_6_months !== undefined && data.subscription_rate_6_months !== null ? parseFloat(data.subscription_rate_6_months) : (memorySubscriptionRate6Months ?? DEFAULT_STORE_SETTINGS.subscriptionRate6Months),
          lastPaymentAmount: data.last_payment_amount !== undefined && data.last_payment_amount !== null ? parseFloat(data.last_payment_amount) : (memoryLastPaymentAmount ?? DEFAULT_STORE_SETTINGS.lastPaymentAmount),
          lastPaymentDate: data.last_payment_date || memoryLastPaymentDate || DEFAULT_STORE_SETTINGS.lastPaymentDate,
          lastPaymentMonths: data.last_payment_months !== undefined && data.last_payment_months !== null ? parseInt(data.last_payment_months) : (memoryLastPaymentMonths ?? DEFAULT_STORE_SETTINGS.lastPaymentMonths),
          subscriptionHistory: history,
          backupFrequency: data.backup_frequency || DEFAULT_STORE_SETTINGS.backupFrequency,
        };
      }
    } catch (e) {
      console.warn("getStoreSettings DB note:", e);
    }

    return {
      ...DEFAULT_STORE_SETTINGS,
      subscriptionExpiryDate: memorySubscriptionExpiryDate || DEFAULT_STORE_SETTINGS.subscriptionExpiryDate,
      subscriptionRate6Months: memorySubscriptionRate6Months ?? DEFAULT_STORE_SETTINGS.subscriptionRate6Months,
      lastPaymentAmount: memoryLastPaymentAmount ?? DEFAULT_STORE_SETTINGS.lastPaymentAmount,
      lastPaymentDate: memoryLastPaymentDate || DEFAULT_STORE_SETTINGS.lastPaymentDate,
      lastPaymentMonths: memoryLastPaymentMonths ?? DEFAULT_STORE_SETTINGS.lastPaymentMonths,
      subscriptionHistory: memorySubscriptionHistory || DEFAULT_STORE_SETTINGS.subscriptionHistory,
    };
  }

  async updateStoreSettings(settings: Partial<StoreSettings>): Promise<StoreSettings> {
    const current = await this.getStoreSettings();
    const updated: StoreSettings = {
      ...current,
      ...settings,
    };

    if (updated.subscriptionExpiryDate) memorySubscriptionExpiryDate = updated.subscriptionExpiryDate;
    if (updated.subscriptionRate6Months !== undefined) memorySubscriptionRate6Months = updated.subscriptionRate6Months;
    if (updated.lastPaymentAmount !== undefined) memoryLastPaymentAmount = updated.lastPaymentAmount;
    if (updated.lastPaymentDate) memoryLastPaymentDate = updated.lastPaymentDate;
    if (updated.lastPaymentMonths !== undefined) memoryLastPaymentMonths = updated.lastPaymentMonths;
    if (updated.subscriptionHistory) memorySubscriptionHistory = updated.subscriptionHistory;

    try {
      const sb = await this.sb();
      const payload: Record<string, any> = {
        id: "default_store",
        store_name: updated.storeName,
        address: updated.address,
        phone: updated.phone,
        email: updated.email,
        gst_number: updated.gstNumber,
        tagline: updated.tagline,
        receipt_footer: updated.receiptFooter,
        tax_enabled: updated.taxEnabled,
        tax_percent: updated.taxPercent,
        tax_label: updated.taxLabel,
        tax_inclusive: updated.taxInclusive,
        show_salesperson_on_bill: updated.showSalespersonOnBill,
        whatsapp_template: updated.whatsappTemplate,
        instagram: updated.instagram,
        whatsapp_number: updated.whatsappNumber,
        subscription_expiry_date: updated.subscriptionExpiryDate || DEFAULT_STORE_SETTINGS.subscriptionExpiryDate,
        subscription_rate_6_months: updated.subscriptionRate6Months ?? DEFAULT_STORE_SETTINGS.subscriptionRate6Months,
        last_payment_amount: updated.lastPaymentAmount ?? DEFAULT_STORE_SETTINGS.lastPaymentAmount,
        last_payment_date: updated.lastPaymentDate || DEFAULT_STORE_SETTINGS.lastPaymentDate,
        last_payment_months: updated.lastPaymentMonths ?? DEFAULT_STORE_SETTINGS.lastPaymentMonths,
        subscription_history: updated.subscriptionHistory || [],
        backup_frequency: updated.backupFrequency || DEFAULT_STORE_SETTINGS.backupFrequency,
        updated_at: new Date().toISOString(),
      };

      const { error } = await sb
        .from("store_settings")
        .upsert(payload, { onConflict: "id" });

      if (error) {
        if (
          error.code === "PGRST204" ||
          error.message?.includes("subscription_expiry_date") ||
          error.message?.includes("subscription_rate_6_months") ||
          error.message?.includes("subscription_history")
        ) {
          console.warn("Notice: subscription columns missing in Supabase schema, storing in memory fallback.");
          delete payload.subscription_expiry_date;
          delete payload.subscription_rate_6_months;
          delete payload.last_payment_amount;
          delete payload.last_payment_date;
          delete payload.last_payment_months;
          delete payload.subscription_history;
          const retryRes = await sb.from("store_settings").upsert(payload, { onConflict: "id" });
          if (retryRes.error) throw retryRes.error;
        } else {
          console.error("updateStoreSettings Supabase error:", error.message);
          throw error;
        }
      }
    } catch (e) {
      console.error("updateStoreSettings exception:", e);
    }

    return updated;
  }

  async syncCustomerStats(params: { customerId?: string | null; customerPhone?: string | null }): Promise<void> {
    const { customerId, customerPhone } = params;
    const cleanPhone = customerPhone?.trim();

    if (!customerId && (!cleanPhone || cleanPhone === "N/A" || cleanPhone === "0000000000")) {
      return;
    }

    try {
      const sb = await this.sb();

      let customer: Customer | undefined;
      if (customerId) {
        customer = await this.getCustomer(customerId);
      }
      if (!customer && cleanPhone) {
        customer = await this.getCustomerByPhone(cleanPhone);
      }

      if (!customer) return;

      let query = sb
        .from("sales")
        .select("total_amount, created_at")
        .eq("deleted", false);

      if (customer.phone && customer.phone !== "N/A" && customer.phone !== "0000000000") {
        query = query.or(`customer_id.eq.${customer.id},customer_phone.eq.${customer.phone}`);
      } else {
        query = query.eq("customer_id", customer.id);
      }

      const { data: sales } = await query.order("created_at", { ascending: false });

      const count = sales?.length || 0;
      const spent = Math.round((sales || []).reduce((sum: number, s: any) => sum + parseFloat(s.total_amount || "0"), 0));
      const lastVisit = sales && sales.length > 0 ? sales[0].created_at : null;

      await sb
        .from("customers")
        .update({
          total_spent: spent.toString(),
          total_sales_count: count,
          last_visit_at: lastVisit,
        } as any)
        .eq("id", customer.id);
    } catch (err: any) {
      console.warn("Failed to sync customer stats:", err?.message);
    }
  }

  // Customers Implementation
  async getCustomers(search?: string, includeDeleted: boolean = false): Promise<Array<Customer & { totalSales?: number; totalSpent?: number; lastPurchaseAt?: string | null }>> {
    try {
      const sb = await this.sb();
      let query = sb.from("customers").select("*").order("name", { ascending: true });
      if (!includeDeleted) {
        query = query.eq("deleted", false);
      }
      if (search && search.trim()) {
        const q = search.trim();
        query = query.or(`name.ilike.%${q}%,phone.ilike.%${q}%`);
      }
      const { data: customerData, error } = await query;
      if (error) {
        console.warn("Error fetching customers:", error.message);
        return [];
      }
      const customersList = (customerData ?? []) as any[];
      if (customersList.length === 0) return [];

      return customersList.map((c) => {
        return {
          ...c,
          deleted: c.deleted ?? false,
          deleted_at: c.deleted_at || c.deletedAt || null,
          createdAt: c.createdAt || c.created_at || null,
          created_at: c.created_at || c.createdAt || null,
          totalSales: c.total_sales_count !== undefined && c.total_sales_count !== null ? Number(c.total_sales_count) : 0,
          totalSpent: c.total_spent !== undefined && c.total_spent !== null ? Math.round(Number(c.total_spent)) : 0,
          lastPurchaseAt: c.last_visit_at || c.last_purchase_at || c.lastPurchaseAt || null,
        };
      });
    } catch (err: any) {
      console.warn("Failed to fetch customers:", err?.message);
      return [];
    }
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    try {
      const { data, error } = await (await this.sb())
        .from("customers")
        .select("*")
        .eq("id", id)
        .single();
      if (error || !data) return undefined;
      return data as Customer;
    } catch (err) {
      return undefined;
    }
  }

  async getCustomerByPhone(phone: string): Promise<Customer | undefined> {
    if (!phone || !phone.trim()) return undefined;
    const cleaned = phone.trim();
    try {
      const { data, error } = await (await this.sb())
        .from("customers")
        .select("*")
        .eq("phone", cleaned)
        .maybeSingle();
      if (error || !data) return undefined;
      return data as Customer;
    } catch (err) {
      return undefined;
    }
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const cleanedName = customer.name?.trim();
    const cleanedPhone = customer.phone?.trim();
    if (!cleanedName || !cleanedPhone) {
      throw new Error("Customer name and phone number are required");
    }
    if (cleanedName.toLowerCase() === "walk-in customer") {
      throw new Error('Cannot create "Walk-in Customer" as a persistent customer record');
    }
    if (cleanedPhone === "N/A" || cleanedPhone === "0000000000") {
      throw new Error("A valid phone number is required");
    }

    const existing = await this.getCustomerByPhone(cleanedPhone);
    if (existing) {
      throw new Error("A customer with this phone number already exists");
    }

    const payload = {
      name: cleanedName,
      phone: cleanedPhone,
      email: customer.email?.trim() || null,
    };

    const { data, error } = await (await this.sb())
      .from("customers")
      .insert(payload)
      .select("*")
      .single();

    if (error) throw error;
    return data as Customer;
  }

  async updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const updates: any = {};
    if (customer.name !== undefined) {
      const cleaned = customer.name.trim();
      if (cleaned.toLowerCase() === "walk-in customer") {
        throw new Error('Customer name cannot be "Walk-in Customer"');
      }
      updates.name = cleaned;
    }
    if (customer.phone !== undefined) {
      const cleanedPhone = customer.phone.trim();
      if (!cleanedPhone || cleanedPhone === "N/A" || cleanedPhone === "0000000000") {
        throw new Error("Valid phone number is required");
      }
      const existing = await this.getCustomerByPhone(cleanedPhone);
      if (existing && existing.id !== id) {
        throw new Error("A customer with this phone number already exists");
      }
      updates.phone = cleanedPhone;
    }
    if (customer.email !== undefined) {
      updates.email = customer.email?.trim() || null;
    }

    const { data, error } = await (await this.sb())
      .from("customers")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error || !data) return undefined;
    return data as Customer;
  }

  async getCustomerSalesCount(id: string): Promise<{ salesCount: number; returnsCount: number }> {
    try {
      const sb = await this.sb();
      const customer = await this.getCustomer(id);
      if (!customer) return { salesCount: 0, returnsCount: 0 };

      let salesQuery = sb
        .from("sales")
        .select("*", { count: "exact", head: true });

      if (customer.phone && customer.phone !== "N/A" && customer.phone !== "0000000000") {
        salesQuery = salesQuery.or(`customer_id.eq.${customer.id},customer_phone.eq.${customer.phone}`);
      } else {
        salesQuery = salesQuery.eq("customer_id", customer.id);
      }

      const { count: sCount, error: sErr } = await salesQuery;
      if (sErr) console.warn("Failed to count sales for customer:", sErr.message);

      let returnsCount = 0;
      try {
        const { count: rCount } = await sb
          .from("sales_returns")
          .select("*", { count: "exact", head: true })
          .eq("customer_id", customer.id);
        returnsCount = rCount || 0;
      } catch (err: any) {
        // Table might not exist or error
      }

      return {
        salesCount: sCount || 0,
        returnsCount,
      };
    } catch (err: any) {
      console.warn("Error in getCustomerSalesCount:", err?.message);
      return { salesCount: 0, returnsCount: 0 };
    }
  }

  async getCustomerRecentSales(id: string, limit = 5): Promise<Sale[]> {
    try {
      const sb = await this.sb();
      const customer = await this.getCustomer(id);
      if (!customer) return [];
      let query = sb
        .from("sales")
        .select("id, invoice_number, total_amount, created_at")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (customer.phone && customer.phone !== "N/A" && customer.phone !== "0000000000") {
        query = query.or(`customer_id.eq.${customer.id},customer_phone.eq.${customer.phone}`);
      } else {
        query = query.eq("customer_id", customer.id);
      }
      const { data, error } = await query;
      if (error) return [];
      return (data ?? []) as any[];
    } catch {
      return [];
    }
  }

  async softDeleteCustomer(id: string): Promise<boolean> {
    const { error } = await (await this.sb())
      .from("customers")
      .update({
        deleted: true,
        deleted_at: new Date().toISOString(),
      } as any)
      .eq("id", id);
    if (error) {
      console.warn("Failed to soft-delete customer:", error.message);
      return false;
    }
    return true;
  }

  async restoreCustomer(id: string): Promise<boolean> {
    const { error } = await (await this.sb())
      .from("customers")
      .update({
        deleted: false,
        deleted_at: null,
      } as any)
      .eq("id", id);
    if (error) {
      console.warn("Failed to restore customer:", error.message);
      return false;
    }
    return true;
  }

  async deleteCustomer(id: string): Promise<boolean> {
    const { salesCount, returnsCount } = await this.getCustomerSalesCount(id);
    if (salesCount > 0 || returnsCount > 0) {
      throw new Error(
        `Cannot delete customer: this customer is linked to ${salesCount} sales transaction(s)${
          returnsCount > 0 ? ` and ${returnsCount} return(s)` : ""
        }. Please archive them instead.`
      );
    }
    const { error } = await (await this.sb())
      .from("customers")
      .delete()
      .eq("id", id);
    if (error) return false;
    return true;
  }

  async findOrCreateCustomer(name: string, phone: string, email?: string): Promise<Customer | null> {
    const cleanedName = name?.trim();
    const cleanedPhone = phone?.trim();

    // DO NOT CREATE customer if phone is invalid/blank OR name is Walk-in Customer
    if (!cleanedPhone || cleanedPhone === "N/A" || cleanedPhone === "0000000000" || cleanedPhone === "0") {
      return null;
    }
    if (!cleanedName || cleanedName.toLowerCase() === "walk-in customer") {
      return null;
    }

    // Check if exists
    const existing = await this.getCustomerByPhone(cleanedPhone);
    if (existing) {
      // Auto-restore customer if they were previously archived
      if ((existing as any).deleted) {
        await this.restoreCustomer(existing.id);
      }
      // Update name if changed
      if (cleanedName && existing.name !== cleanedName) {
        await this.updateCustomer(existing.id, { name: cleanedName });
      }
      return existing;
    }

    // Otherwise create new
    try {
      return await this.createCustomer({
        name: cleanedName,
        phone: cleanedPhone,
        email: email?.trim() || null,
      });
    } catch (e: any) {
      console.warn("findOrCreateCustomer fallback:", e?.message);
      return null;
    }
  }

  async getCustomerWithHistory(id: string): Promise<{
    customer: Customer;
    totalSales: number;
    totalSpent: number;
    sales: Sale[];
  } | undefined> {
    const customer = await this.getCustomer(id);
    if (!customer) return undefined;

    const sb = await this.sb();
    let query = sb
      .from("sales")
      .select("*")
      .eq("deleted", false);

    if (customer.phone) {
      query = query.or(`customer_id.eq.${customer.id},customer_phone.eq.${customer.phone}`);
    } else {
      query = query.eq("customer_id", customer.id);
    }

    const { data: salesData } = await query.order("created_at", { ascending: false });
    const sales = (salesData ?? []) as Sale[];

    const totalSales = sales.length;
    const totalSpent = sales.reduce((sum, s) => sum + parseFloat(s.total_amount || "0"), 0);

    return {
      customer,
      totalSales,
      totalSpent: Math.round(totalSpent),
      sales,
    };
  }
}

