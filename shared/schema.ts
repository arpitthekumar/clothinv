import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("employee"), // admin or employee
  fullName: text("full_name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  sku: text("sku").notNull().unique(),
  categoryId: varchar("category_id").references(() => categories.id),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  size: text("size"),
  stock: integer("stock").notNull().default(0),
  minStock: integer("min_stock").default(5),
  barcode: text("barcode"),
  deleted: boolean("deleted").default(false),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const sales = pgTable("sales", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  customerId: varchar("customer_id").references(() => customers.id),
  items: jsonb("items").notNull(), // Array of {productId, quantity, price}
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull().default("cash"),
  invoiceNumber: text("invoice_number").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const stockMovements = pgTable("stock_movements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").references(() => products.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // 'po_receipt' | 'sale_out' | 'return_in' | 'damage_out' | 'manual_adjust'
  quantity: integer("quantity").notNull(),
  reason: text("reason"),
  refTable: text("ref_table"), // e.g., 'purchase_order_items', 'sale_items', 'sales_return_items'
  refId: varchar("ref_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const syncStatus = pgTable("sync_status", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tableName: text("table_name").notNull(),
  lastSyncAt: timestamp("last_sync_at").defaultNow(),
  pendingChanges: integer("pending_changes").default(0),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
  fullName: true,
});

export const insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
  description: true,
});

export const insertProductSchema = createInsertSchema(products).pick({
  name: true,
  sku: true,
  categoryId: true,
  description: true,
  price: true,
  size: true,
  stock: true,
  minStock: true,
  barcode: true,
});

export const insertSaleSchema = createInsertSchema(sales).pick({
  userId: true,
  items: true,
  totalAmount: true,
  paymentMethod: true,
  invoiceNumber: true,
});

export const insertStockMovementSchema = createInsertSchema(stockMovements).pick({
  productId: true,
  userId: true,
  type: true,
  quantity: true,
  reason: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Sale = typeof sales.$inferSelect;
export type InsertSale = z.infer<typeof insertSaleSchema>;
export type StockMovement = typeof stockMovements.$inferSelect;
export type InsertStockMovement = z.infer<typeof insertStockMovementSchema>;
export type SyncStatus = typeof syncStatus.$inferSelect;

// Sale item type
export type SaleItem = {
  productId: string;
  quantity: number;
  price: string;
  name: string;
  sku: string;
};

// New: Suppliers & Purchasing
export const suppliers = pgTable("suppliers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const supplierProducts = pgTable("supplier_products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  supplierId: varchar("supplier_id").references(() => suppliers.id).notNull(),
  productId: varchar("product_id").references(() => products.id).notNull(),
  supplierSku: text("supplier_sku"),
  defaultCost: decimal("default_cost", { precision: 10, scale: 2 }),
  leadTimeDays: integer("lead_time_days"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const purchaseOrders = pgTable("purchase_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  supplierId: varchar("supplier_id").references(() => suppliers.id).notNull(),
  status: text("status").notNull().default("draft"), // draft | ordered | received | closed
  expectedDate: timestamp("expected_date"),
  receivedDate: timestamp("received_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const purchaseOrderItems = pgTable("purchase_order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  purchaseOrderId: varchar("purchase_order_id").references(() => purchaseOrders.id).notNull(),
  productId: varchar("product_id").references(() => products.id).notNull(),
  quantityOrdered: integer("quantity_ordered").notNull(),
  quantityReceived: integer("quantity_received").notNull().default(0),
  unitCost: decimal("unit_cost", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// New: Pricing & Cost History
export const productCostHistory = pgTable("product_cost_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").references(() => products.id).notNull(),
  cost: decimal("cost", { precision: 10, scale: 2 }).notNull(),
  source: text("source").notNull(), // 'PO' | 'manual'
  effectiveAt: timestamp("effective_at").defaultNow(),
});

export const productPriceHistory = pgTable("product_price_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").references(() => products.id).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  effectiveAt: timestamp("effective_at").defaultNow(),
});

// New: Promotions
export const promotions = pgTable("promotions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'percent' | 'fixed'
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  startsAt: timestamp("starts_at"),
  endsAt: timestamp("ends_at"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const promotionTargets = pgTable("promotion_targets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  promotionId: varchar("promotion_id").references(() => promotions.id).notNull(),
  targetType: text("target_type").notNull(), // 'product' | 'category'
  targetId: varchar("target_id").notNull(),
});

// New: Customers
export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow(),
});

// New: Sales normalization and returns
export const saleItems = pgTable("sale_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  saleId: varchar("sale_id").references(() => sales.id).notNull(),
  productId: varchar("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  name: text("name").notNull(), // snapshot
  sku: text("sku").notNull(), // snapshot
  createdAt: timestamp("created_at").defaultNow(),
});

export const salesReturns = pgTable("sales_returns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  saleId: varchar("sale_id").references(() => sales.id).notNull(),
  customerId: varchar("customer_id").references(() => customers.id),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const salesReturnItems = pgTable("sales_return_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salesReturnId: varchar("sales_return_id").references(() => salesReturns.id).notNull(),
  saleItemId: varchar("sale_item_id").references(() => saleItems.id),
  productId: varchar("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull(),
  refundAmount: decimal("refund_amount", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// New: Payments (Razorpay etc.)
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  saleId: varchar("sale_id").references(() => sales.id).notNull(),
  provider: text("provider").notNull(), // 'razorpay'
  orderId: text("order_id"),
  paymentId: text("payment_id"),
  status: text("status").notNull().default("created"), // created | authorized | captured | failed | refunded
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  method: text("method"), // UPI | card | netbanking
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas (new)
export const insertSupplierSchema = createInsertSchema(suppliers).pick({
  name: true,
  phone: true,
  email: true,
  address: true,
  notes: true,
});

export const insertPurchaseOrderSchema = createInsertSchema(purchaseOrders).pick({
  supplierId: true,
  status: true,
  expectedDate: true,
  notes: true,
});

export const insertPurchaseOrderItemSchema = createInsertSchema(purchaseOrderItems).pick({
  purchaseOrderId: true,
  productId: true,
  quantityOrdered: true,
  unitCost: true,
});

export const insertProductCostSchema = createInsertSchema(productCostHistory).pick({
  productId: true,
  cost: true,
  source: true,
  effectiveAt: true,
});

export const insertProductPriceSchema = createInsertSchema(productPriceHistory).pick({
  productId: true,
  price: true,
  effectiveAt: true,
});

export const insertPromotionSchema = createInsertSchema(promotions).pick({
  name: true,
  type: true,
  value: true,
  startsAt: true,
  endsAt: true,
  active: true,
});

export const insertPromotionTargetSchema = createInsertSchema(promotionTargets).pick({
  promotionId: true,
  targetType: true,
  targetId: true,
});

export const insertCustomerSchema = createInsertSchema(customers).pick({
  name: true,
  phone: true,
  email: true,
});

export const insertSaleItemSchema = createInsertSchema(saleItems).pick({
  saleId: true,
  productId: true,
  quantity: true,
  price: true,
  name: true,
  sku: true,
});

export const insertSalesReturnSchema = createInsertSchema(salesReturns).pick({
  saleId: true,
  customerId: true,
  reason: true,
});

export const insertSalesReturnItemSchema = createInsertSchema(salesReturnItems).pick({
  salesReturnId: true,
  saleItemId: true,
  productId: true,
  quantity: true,
  refundAmount: true,
});

export const insertPaymentSchema = createInsertSchema(payments).pick({
  saleId: true,
  provider: true,
  orderId: true,
  paymentId: true,
  status: true,
  amount: true,
  method: true,
});

// Types (new)
export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type SupplierProduct = typeof supplierProducts.$inferSelect;
export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type InsertPurchaseOrder = z.infer<typeof insertPurchaseOrderSchema>;
export type PurchaseOrderItem = typeof purchaseOrderItems.$inferSelect;
export type InsertPurchaseOrderItem = z.infer<typeof insertPurchaseOrderItemSchema>;
export type ProductCost = typeof productCostHistory.$inferSelect;
export type InsertProductCost = z.infer<typeof insertProductCostSchema>;
export type ProductPrice = typeof productPriceHistory.$inferSelect;
export type InsertProductPrice = z.infer<typeof insertProductPriceSchema>;
export type Promotion = typeof promotions.$inferSelect;
export type InsertPromotion = z.infer<typeof insertPromotionSchema>;
export type PromotionTarget = typeof promotionTargets.$inferSelect;
export type InsertPromotionTarget = z.infer<typeof insertPromotionTargetSchema>;
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type SaleItemRow = typeof saleItems.$inferSelect;
export type InsertSaleItemRow = z.infer<typeof insertSaleItemSchema>;
export type SalesReturn = typeof salesReturns.$inferSelect;
export type InsertSalesReturn = z.infer<typeof insertSalesReturnSchema>;
export type SalesReturnItem = typeof salesReturnItems.$inferSelect;
export type InsertSalesReturnItem = z.infer<typeof insertSalesReturnItemSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;


