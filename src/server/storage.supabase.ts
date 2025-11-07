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
    const { data, error } = await this.client
      .from("categories")
      .insert(category)
      .select("*")
      .single();
    if (error) throw error;
    return data as Category;
  }
  async updateCategory(
    id: string,
    category: Partial<InsertCategory>
  ): Promise<Category | undefined> {
    const { data, error } = await this.client
      .from("categories")
      .update(category)
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    return (data ?? undefined) as Category | undefined;
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
    console.log("Creating sales return for saleId:", saleId, "items:", items);

    const { data: sr, error: srErr } = await this.client
      .from("sales_returns")
      .insert({ sale_id: saleId, customer_id: customerId as any, reason })
      .select("id")
      .single();
    if (srErr) {
      console.error("Error creating sales return:", srErr);
      throw srErr;
    }

    for (const it of items) {
      // Find the sale_item_id for this product in this sale
      let saleItemId = it.saleItemId;
      if (!saleItemId) {
        console.log(
          "Looking up sale_item_id for saleId:",
          saleId,
          "productId:",
          it.productId
        );

        // First check if sale_items table exists and has data
        const { data: allSaleItems, error: checkErr } = await this.client
          .from("sale_items")
          .select("*")
          .eq("sale_id", saleId)
          .limit(5);

        console.log("All sale items for this sale:", allSaleItems);
        if (checkErr) {
          console.error("Error checking sale items table:", checkErr);
          throw checkErr;
        }

        const { data: saleItem, error: itemErr } = await this.client
          .from("sale_items")
          .select("id")
          .eq("sale_id", saleId)
          .eq("product_id", it.productId)
          .maybeSingle();
        if (itemErr) {
          console.error("Error looking up sale item:", itemErr);
          throw itemErr;
        }
        saleItemId = saleItem?.id;
        console.log("Found sale_item_id:", saleItemId);

        // If no sale_item found, create one from the original sale data
        if (!saleItemId) {
          console.log("No sale_item found, creating one from sale data");
          const { data: saleData, error: saleErr } = await this.client
            .from("sales")
            .select("items")
            .eq("id", saleId)
            .single();

          if (saleErr) {
            console.error("Error fetching sale data:", saleErr);
            throw saleErr;
          }

          // Parse the items and find the matching product
          const items =
            typeof saleData.items === "string"
              ? JSON.parse(saleData.items)
              : saleData.items;
          const itemArray = Array.isArray(items) ? items : [items];
          const matchingItem = itemArray.find(
            (item: any) => item.productId === it.productId
          );

          if (matchingItem) {
            const { data: newSaleItem, error: createErr } = await this.client
              .from("sale_items")
              .insert({
                sale_id: saleId,
                product_id: it.productId,
                quantity: matchingItem.quantity,
                price: matchingItem.price,
                name: matchingItem.name,
                sku: matchingItem.sku,
              })
              .select("id")
              .single();

            if (createErr) {
              console.error("Error creating sale item:", createErr);
              throw createErr;
            }

            saleItemId = newSaleItem.id;
            console.log("Created new sale_item_id:", saleItemId);
          } else {
            console.error(
              "Could not find matching item in sale data for productId:",
              it.productId
            );
            throw new Error(
              `Product ${it.productId} not found in sale ${saleId}`
            );
          }
        }
      }

      const { error: sriErr } = await this.client
        .from("sales_return_items")
        .insert({
          sales_return_id: sr.id,
          sale_item_id: saleItemId as any,
          product_id: it.productId,
          quantity: it.quantity as any,
          refund_amount: (it.refundAmount ?? null) as any,
        } as any);
      if (sriErr) throw sriErr;

      // Restock and create movement
      console.log(
        "Updating inventory for productId:",
        it.productId,
        "returning quantity:",
        it.quantity
      );
      const { data: productRow, error: prodErr } = await this.client
        .from("products")
        .select("id, stock")
        .eq("id", it.productId)
        .maybeSingle();
      if (prodErr) throw prodErr;
      const currentStock = (productRow?.stock ?? 0) as number;
      const newStock = currentStock + it.quantity;
      console.log("Current stock:", currentStock, "New stock:", newStock);

      const { error: stockErr } = await this.client
        .from("products")
        .update({ stock: newStock as any })
        .eq("id", it.productId);
      if (stockErr) {
        console.error("Error updating stock:", stockErr);
        throw stockErr;
      }
      console.log("Stock updated successfully");

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

    // Update the original sale's items to reflect returned quantities
    console.log("Updating original sale items to reflect returns");
    const { data: originalSale, error: saleErr } = await this.client
      .from("sales")
      .select("items")
      .eq("id", saleId)
      .single();

    if (saleErr) {
      console.error("Error fetching original sale:", saleErr);
      throw saleErr;
    }

    // Parse and update the items
    const originalItems =
      typeof originalSale.items === "string"
        ? JSON.parse(originalSale.items)
        : originalSale.items;
    const itemArray = Array.isArray(originalItems)
      ? originalItems
      : [originalItems];

    // Update quantities for returned items
    for (const returnedItem of items) {
      const itemIndex = itemArray.findIndex(
        (item: any) => item.productId === returnedItem.productId
      );
      if (itemIndex !== -1) {
        itemArray[itemIndex].quantity = Math.max(
          0,
          itemArray[itemIndex].quantity - returnedItem.quantity
        );
        console.log(
          `Updated quantity for product ${returnedItem.productId}: ${itemArray[itemIndex].quantity}`
        );
      }
    }

    // Remove items with 0 quantity
    const updatedItems = itemArray.filter((item: any) => item.quantity > 0);

    // Update the sale with new items
    const { error: updateErr } = await this.client
      .from("sales")
      .update({ items: updatedItems })
      .eq("id", saleId);

    if (updateErr) {
      console.error("Error updating sale items:", updateErr);
      throw updateErr;
    }

    console.log("Sale items updated successfully");
    return { salesReturnId: sr.id as string };
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
  async getNotSellingProducts({ sinceDays }: { sinceDays: number }) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - sinceDays);

    // 1️⃣ Fetch all products (including delete flags)
    const { data: products, error: productsError } = await this.client
      .from("products")
      .select("id, name, sku, stock, deleted_at, deleted")
      .order("name", { ascending: true });

    if (productsError) throw productsError;

    // 2️⃣ Fetch sales with product IDs
    const { data: sales, error: salesError } = await this.client
      .from("sales")
      .select("created_at, items, deleted")
      .eq("deleted", false);

    if (salesError) throw salesError;

    // 3️⃣ Compute last sold date for each product
    const lastSoldMap: Record<string, string> = {};

    for (const sale of sales) {
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

    // 4️⃣ Filter products not sold recently or never sold
    const notSelling = products
      .filter((p: any) => {
        const lastSoldAt = lastSoldMap[p.id]
          ? new Date(lastSoldMap[p.id])
          : null;
        const isOldOrNeverSold = !lastSoldAt || lastSoldAt < cutoffDate;
        const isDeleted = p.deleted || !!p.deleted_at;

        return isOldOrNeverSold && !isDeleted;
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
    // ✅ Fetch all products
    const { data: products, error } = await this.client
      .from("products")
      .select("id, name, price, stock, deleted, buying_price");

    if (error) throw error;

    // ✅ Filter out deleted or invalid products
    const validProducts = (products || []).filter((p: any) => !p.deleted);

    // ✅ Calculate per-product valuation
    const byProduct = validProducts.map((p: any) => {
      const cost = Number(p.buying_price ?? p.price ?? 0);
      return {
        productId: p.id,
        name: p.name,
        stock: p.stock || 0,
        cost,
        valuation: (p.stock || 0) * cost,
      };
    });

    // ✅ Calculate total valuation
    const totalValuation = byProduct.reduce((sum, p) => sum + p.valuation, 0);

    return {
      totalValuation,
      byProduct,
    };
  }

  async getProfitMargins(params: { sinceDays: number }) {
    const since = new Date();
    since.setDate(since.getDate() - params.sinceDays);
    const { data, error } = await this.client.rpc("profit_margins", {
      since_ts: since.toISOString(),
    });
    if (error) throw error;
    return data as any;
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
