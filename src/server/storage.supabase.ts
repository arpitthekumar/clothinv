import { getSupabaseServer } from "./supabase";
import { type IStorage } from "./storage";
import {
  type User,
  type InsertUser,
  type Product,
  type InsertProduct,
  type Category,
  type InsertCategory,
  type Sale,
  type InsertSale,
  type StockMovement,
  type InsertStockMovement,
  type Supplier,
  type InsertSupplier,
  type PurchaseOrder,
  type InsertPurchaseOrder,
  type PurchaseOrderItem,
  type InsertPurchaseOrderItem,
} from "@shared/schema";

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
    const { data, error } = await this.client
      .from("users")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return (data ?? undefined) as User | undefined;
  }
  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data, error } = await this.client
      .from("users")
      .select("*")
      .eq("username", username)
      .maybeSingle();
    if (error) throw error;
    return (data ?? undefined) as User | undefined;
  }
  async createUser(user: InsertUser): Promise<User> {
    const { data, error } = await this.client
      .from("users")
      .insert(user)
      .select("*")
      .single();
    if (error) throw error;
    return data as User;
  }
  async updateUser(
    id: string,
    user: Partial<InsertUser>
  ): Promise<User | undefined> {
    const { data, error } = await this.client
      .from("users")
      .update(user)
      .eq("id", id)
      .select("*")
      .maybeSingle();
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
    const payload = {
      id: crypto.randomUUID(), // 🔥 add this (very important)
      name: category.name,
      description: category.description ?? null,
      color: category.color ?? "white",
    };

    const { data, error } = await this.client
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

    const { data, error } = await this.client
      .from("categories")
      .update(payload)
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error) throw error;
    return data ?? undefined;
  }

  async deleteCategory(id: string): Promise<boolean> {
    const { error } = await this.client
      .from("categories")
      .delete()
      .eq("id", id);
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
    const { data, error } = await this.client
      .from("products")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return (data ?? undefined) as Product | undefined;
  }
  async getProductBySku(sku: string): Promise<Product | undefined> {
    const { data, error } = await this.client
      .from("products")
      .select("*")
      .eq("sku", sku)
      .maybeSingle();
    if (error) throw error;
    return (data ?? undefined) as Product | undefined;
  }
  async getProductByBarcode(barcode: string): Promise<Product | undefined> {
    const { data, error } = await this.client
      .from("products")
      .select("*")
      .eq("barcode", barcode)
      .maybeSingle();
    if (error) throw error;
    return (data ?? undefined) as Product | undefined;
  }
  async createProduct(product: InsertProduct): Promise<Product> {
    const { data, error } = await this.client
      .from("products")
      .insert(product)
      .select("*")
      .single();
    if (error) throw error;
    return data as Product;
  }
  async updateProduct(
    id: string,
    product: Partial<InsertProduct>
  ): Promise<Product | undefined> {
    const { data, error } = await this.client
      .from("products")
      .update(product)
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    return (data ?? undefined) as Product | undefined;
  }
  async deleteProduct(id: string): Promise<boolean> {
    const sb = this.client;

    // 1) Remove dependent rows that reference this product
    // 1a) Sales return items -> may reference sale_items and product
    const { error: sriErr } = await sb
      .from("sales_return_items")
      .delete()
      .eq("product_id", id);
    if (sriErr) throw sriErr;

    // 1b) Sale items for this product
    const { error: siErr } = await sb
      .from("sale_items")
      .delete()
      .eq("product_id", id);
    if (siErr) throw siErr;

    // 1c) Stock movements for this product
    const { error: smErr } = await sb
      .from("stock_movements")
      .delete()
      .eq("product_id", id);
    if (smErr) throw smErr;

    // 1d) Supplier product mappings
    const { error: spErr } = await sb
      .from("supplier_products")
      .delete()
      .eq("product_id", id);
    if (spErr) throw spErr;

    // 1e) Purchase order items for this product
    const { error: poiErr } = await sb
      .from("purchase_order_items")
      .delete()
      .eq("product_id", id);
    if (poiErr) throw poiErr;

    // 1f) Cost/price histories
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

    // 1g) Promotion targets pointing to this product (by convention)
    const { error: promoErr } = await sb
      .from("promotion_targets")
      .delete()
      .eq("target_type", "product")
      .eq("target_id", id);
    if (promoErr) throw promoErr;

    // 2) Finally delete the product
    const { error: prodErr } = await sb.from("products").delete().eq("id", id);
    if (prodErr) throw prodErr;
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
  async updateStock(
    id: string,
    quantity: number
  ): Promise<Product | undefined> {
    const { data, error } = await this.client
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
    let query = this.client.from("sales").select("*");
    if (!includeDeleted) {
      query = query.eq("deleted", false);
    }
    const { data, error } = await query.order("created_at", {
      ascending: false,
    });
    if (error) throw error;
    return data as Sale[];
  }
  // storage.ts (update this method)
  async getSalesFiltered(params: {
    userId?: string | null;
    limit: number;
    cursor?: string | null;
    deleted?: boolean;
    payment?: string | null;
    category?: string | null;
    product?: string | null;
    start?: string | null;
    end?: string | null;
    search?: string | null;
    searchBy?: string; // ← add this
  }) {
    const {
      userId,
      limit,
      cursor,
      deleted,
      payment,
      category,
      product,
      start,
      end,
      search,
      searchBy,
    } = params;

    let query = this.client.from("sales").select("*");

    if (userId) query = query.eq("user_id", userId);

    if (deleted !== undefined) query = query.eq("deleted", deleted);

    if (payment) query = query.ilike("payment_method", payment);

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

    const { data, error } = await query;
    if (error) throw error;

    const hasMore = data.length > limit;
    const result = hasMore ? data.slice(0, limit) : data;

    return {
      data: result,
      nextCursor: hasMore ? result[result.length - 1].created_at : null,
    };
  }

  public querySalesTable() {
    return this.client.from("sales");
  }

  async getSalesByUser(
    userId: string,
    includeDeleted: boolean = false
  ): Promise<Sale[]> {
    let query = this.client.from("sales").select("*").eq("user_id", userId);
    if (!includeDeleted) {
      query = query.eq("deleted", false);
    }
    const { data, error } = await query.order("created_at", {
      ascending: false,
    });
    if (error) throw error;
    return data as Sale[];
  }
  async getSalesToday(): Promise<Sale[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { data, error } = await this.client
      .from("sales")
      .select("*")
      .gte("created_at", today.toISOString())
      .eq("deleted", false) // Exclude deleted sales
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as Sale[];
  }
  async createSale(sale: InsertSale): Promise<Sale> {
    const payload = {
      user_id: sale.user_id,
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
    };
    const { data, error } = await this.client
      .from("sales")
      .insert(payload)
      .select("*")
      .single();
    if (error) throw error;
    return data as Sale;
  }
  async softDeleteSale(saleId: string): Promise<boolean> {
    const { error } = await this.client
      .from("sales")
      .update({ deleted: true, deleted_at: new Date().toISOString() as any })
      .eq("id", saleId);
    if (error) throw error;
    return true;
  }
  async restoreSale(saleId: string): Promise<boolean> {
    const { error } = await this.client
      .from("sales")
      .update({ deleted: false, deleted_at: null as any })
      .eq("id", saleId);
    if (error) throw error;
    return true;
  }
  async deleteSale(saleId: string): Promise<boolean> {
    const sb = this.client;

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

    // 5) Finally delete the sale row
    const { error: saleDeleteError } = await sb
      .from("sales")
      .delete()
      .eq("id", saleId);
    if (saleDeleteError) throw saleDeleteError;

    return true;
  }

  // Stock Movements
  async getStockMovements(): Promise<StockMovement[]> {
    const { data, error } = await this.client
      .from("stock_movements")
      .select("*");
    if (error) throw error;
    return data as StockMovement[];
  }
  async getStockMovementsByProduct(
    productId: string
  ): Promise<StockMovement[]> {
    const { data, error } = await this.client
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
    const { data, error } = await this.client
      .from("stock_movements")
      .insert(payload)
      .select("*")
      .single();
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
    const { data, error } = await this.client
      .from("suppliers")
      .insert(supplier)
      .select("*")
      .single();
    if (error) throw error;
    return data as Supplier;
  }

  // Purchase Orders
  async getPurchaseOrders(): Promise<PurchaseOrder[]> {
    const { data, error } = await this.client
      .from("purchase_orders")
      .select("*");
    if (error) throw error;
    return data as PurchaseOrder[];
  }
  async createPurchaseOrder(po: InsertPurchaseOrder): Promise<PurchaseOrder> {
    const { data, error } = await this.client
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
    const { data, error } = await this.client
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
    const sb = this.client;
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
      const { error } = await this.client.from("sale_items").insert({
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
    const { data: sr, error: srErr } = await this.client
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
        const { data: saleItem, error: findErr } = await this.client
          .from("sale_items")
          .select("id")
          .eq("sale_id", saleId)
          .eq("product_id", it.productId)
          .maybeSingle();

        if (findErr) throw findErr;

        saleItemId = saleItem?.id || null;

        // STEP B — If missing in sale_items table → create from original sale JSON
        if (!saleItemId) {
          const { data: saleData, error: saleErr } = await this.client
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

          const { data: newSaleItem, error: createErr } = await this.client
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
      const { error: sriErr } = await this.client
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
      const { data: prod, error: prodErr } = await this.client
        .from("products")
        .select("stock")
        .eq("id", it.productId)
        .maybeSingle();

      if (prodErr) throw prodErr;

      const newStock = Number(prod?.stock || 0) + it.quantity;

      const { error: updErr } = await this.client
        .from("products")
        .update({ stock: newStock })
        .eq("id", it.productId);

      if (updErr) throw updErr;

      // STEP E — Log stock movement
      const { error: moveErr } = await this.client
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

    const { data: saleMeta, error: saleMetaErr } = await this.client
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
    const { error: finalErr } = await this.client
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
    const { data, error } = await this.client
      .from("promotions")
      .select("*")
      .eq("active", true);
    if (error) throw error;
    return data as any;
  }
  async createPromotion(promo: any) {
    const { data, error } = await this.client
      .from("promotions")
      .insert(promo)
      .select("*")
      .single();
    if (error) throw error;
    return data as any;
  }
  async addPromotionTarget(target: any) {
    const { data, error } = await this.client
      .from("promotion_targets")
      .insert(target)
      .select("*")
      .single();
    if (error) throw error;
    return data as any;
  }
  async getPromotionTargets() {
    const { data, error } = await this.client
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
    const { data: products, error: productsError } = await this.client
      .from("products")
      .select("id, name, sku, stock, deleted_at, deleted")
      .order("name", { ascending: true });

    if (productsError) throw productsError;

    // 2️⃣ Fetch sales with product IDs
    // For date range queries, we need to check if products were sold IN the range
    // So we fetch sales within the range to see which products were sold
    // For sinceDays queries, we just need sales after cutoffDate
    let salesQuery = this.client
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
    const { data: allSales, error: allSalesError } = await this.client
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
    const { data: products, error } = await this.client
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

  async getProfitMargins(params: {
    sinceDays: number;
    fromDate?: Date;
    toDate?: Date;
  }) {
    // Use fromDate if provided, otherwise calculate from sinceDays
    let since: Date;
    if (params.fromDate) {
      since = new Date(params.fromDate);
    } else {
      since = new Date();
      since.setDate(since.getDate() - params.sinceDays);
    }

    const { data, error } = await this.client.rpc("profit_margins", {
      since_ts: since.toISOString(),
    });
    if (error) throw error;

    // If toDate is provided, we need to filter the results
    // The RPC function returns all sales since the since_ts date
    // So we filter client-side if toDate is provided
    let result = data as any;

    if (params.toDate && result) {
      const toDate = new Date(params.toDate);
      toDate.setHours(23, 59, 59, 999);

      // Filter the sales data by toDate if the RPC returns detailed data
      // If it's just aggregated data, we might need to recalculate
      // For now, we'll assume the RPC returns aggregated data and we can't filter it
      // So we'll fetch sales directly and calculate profit if both dates are provided
      if (params.fromDate && params.toDate) {
        // Fetch sales in the date range and calculate profit
        const { data: sales, error: salesError } = await this.client
          .from("sales")
          .select("items, created_at, total_amount, discount_amount")
          .eq("deleted", false)
          .gte("created_at", params.fromDate.toISOString())
          .lte("created_at", toDate.toISOString());

        if (!salesError && sales) {
          // Calculate profit from sales
          const { data: products } = await this.client
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

          for (const sale of sales) {
            let items: any[] = [];
            try {
              items = Array.isArray(sale.items)
                ? sale.items
                : JSON.parse(sale.items || "[]");
            } catch (e) {
              continue;
            }

            const discountAmount =
              Number((sale as any).discount_amount || 0) || 0;
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
              const costPrice = Number(
                product.buying_price || product.price || 0
              );

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

          // Calculate margin percentages
          for (const key in byProduct) {
            const p = byProduct[key];
            p.marginPercent = p.revenue > 0 ? (p.profit / p.revenue) * 100 : 0;
          }

          result = {
            totalProfit,
            byProduct: Object.values(byProduct),
          };
        }
      }
    }

    return result;
  }

  // Payments
  async createPayment(payment: any) {
    const { data, error } = await this.client
      .from("payments")
      .insert(payment)
      .select("*")
      .single();
    if (error) throw error;
    return data as any;
  }
  async updatePayment(id: string, dataPatch: any) {
    const { data, error } = await this.client
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
    const { data, error } = await this.client
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
    const { data, error } = await this.client
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
    const { data, error } = await this.client
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
    const { data, error } = await this.client
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
    const { error } = await this.client
      .from("discount_coupons")
      .delete()
      .eq("id", id);
    if (error) throw error;
    return true;
  }
}
