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
} from "@shared/schema";
import { type StoreSettings, DEFAULT_STORE_SETTINGS } from "@/types/store-settings";
import { SupabaseStorage } from "./storage.supabase";

export interface IStorage {
  // Salespersons
  getSalespersons(includeInactive?: boolean): Promise<Salesperson[]>;
  getSalesperson(id: string): Promise<Salesperson | undefined>;
  createSalesperson(salesperson: InsertSalesperson): Promise<Salesperson>;
  updateSalesperson(
    id: string,
    salesperson: Partial<InsertSalesperson>
  ): Promise<Salesperson | undefined>;
  deleteSalesperson(id: string): Promise<boolean>;
  getSalespersonSalesCount(id: string): Promise<number>;
  getSalespersonRecentSales(id: string, limit?: number): Promise<Sale[]>;

  // Users & Sessions
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  getUsers(): Promise<User[]>;
  getUserSalesCount(userId: string): Promise<number>;
  getUserRecentSales(userId: string, limit?: number): Promise<Sale[]>;
  getUserSessions(userId: string): Promise<UserSession[]>;
  createUserSession(session: {
    userId: string;
    sessionToken: string;
    deviceName: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<UserSession>;
  touchUserSession(sessionToken: string): Promise<void>;
  updateHeartbeat(
    sessionToken: string,
    isBusy?: boolean,
    currentOperation?: string
  ): Promise<boolean>;
  updateApiActivity(sessionToken: string): Promise<void>;
  revokeSession(sessionIdOrToken: string, reason?: string, userId?: string): Promise<boolean>;
  revokeAllUserSessions(userId: string, reason?: string, exceptToken?: string): Promise<boolean>;
  deleteUserSession(sessionIdOrToken: string, userId?: string): Promise<boolean>;
  deleteAllOtherUserSessions(userId: string, currentSessionToken: string): Promise<boolean>;



  // Categories
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(
    id: string,
    category: Partial<InsertCategory>
  ): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<boolean>;

  // Products
  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  getProductBySku(sku: string): Promise<Product | undefined>;
  getProductByBarcode(barcode: string): Promise<Product | undefined>;
  getProducts(includeDeleted?: boolean): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(
    id: string,
    product: Partial<InsertProduct>
  ): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;
  getProductSalesCount(productId: string): Promise<number>;
  getProductRecentSales(
    productId: string,
    limit?: number
  ): Promise<
    Array<{
      id: string;
      invoiceNumber: string;
      amount: string;
      quantity: number;
      customerName?: string;
      createdAt?: string;
    }>
  >;
  updateStock(id: string, quantity: number): Promise<Product | undefined>;
  softDeleteProduct: (id: string) => Promise<boolean>;
  restoreProduct: (id: string) => Promise<boolean>;

  // Sales
  getSales(includeDeleted?: boolean): Promise<Sale[]>;
  getSalesByUser(userId: string, includeDeleted?: boolean): Promise<Sale[]>;
  getSalesToday(): Promise<Sale[]>;
  createSale(sale: InsertSale): Promise<Sale>;
  softDeleteSale(saleId: string): Promise<boolean>;
  restoreSale(saleId: string): Promise<boolean>;
  // Permanently delete a sale
  deleteSale(saleId: string): Promise<boolean>;

  // Stock Movements
  getStockMovements(): Promise<StockMovement[]>;
  getStockMovementsByProduct(productId: string): Promise<StockMovement[]>;
  createStockMovement(movement: InsertStockMovement): Promise<StockMovement>;

  // Suppliers
  getSuppliers(): Promise<import("@shared/schema").Supplier[]>;
  createSupplier(
    supplier: import("@shared/schema").InsertSupplier
  ): Promise<import("@shared/schema").Supplier>;

  // Purchase Orders
  getPurchaseOrders(): Promise<import("@shared/schema").PurchaseOrder[]>;
  createPurchaseOrder(
    po: import("@shared/schema").InsertPurchaseOrder
  ): Promise<import("@shared/schema").PurchaseOrder>;
  addPurchaseOrderItem(
    item: import("@shared/schema").InsertPurchaseOrderItem
  ): Promise<import("@shared/schema").PurchaseOrderItem>;
  receivePurchaseOrderItems(params: {
    items: Array<{ purchaseOrderItemId: string; quantity: number }>;
    userId: string;
  }): Promise<void>;

  // Sales normalization & Returns
  createSaleItems(
    saleId: string,
    items: Array<{
      productId: string;
      quantity: number;
      price: string;
      name: string;
      sku: string;
    }>
  ): Promise<void>;
  createSalesReturn(params: {
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
  }): Promise<{ salesReturnId: string }>;

  // Promotions
  getPromotions(): Promise<import("@shared/schema").Promotion[]>;
  createPromotion(
    promo: import("@shared/schema").InsertPromotion
  ): Promise<import("@shared/schema").Promotion>;
  addPromotionTarget(
    target: import("@shared/schema").InsertPromotionTarget
  ): Promise<import("@shared/schema").PromotionTarget>;
  getPromotionTargets(): Promise<import("@shared/schema").PromotionTarget[]>;

  // Customers
  getCustomers(search?: string, includeDeleted?: boolean): Promise<Array<import("@shared/schema").Customer & { totalSales?: number; totalSpent?: number; lastPurchaseAt?: string | null }>>;
  getCustomer(id: string): Promise<import("@shared/schema").Customer | undefined>;
  getCustomerByPhone(phone: string): Promise<import("@shared/schema").Customer | undefined>;
  createCustomer(customer: import("@shared/schema").InsertCustomer): Promise<import("@shared/schema").Customer>;
  updateCustomer(id: string, customer: Partial<import("@shared/schema").InsertCustomer>): Promise<import("@shared/schema").Customer | undefined>;
  deleteCustomer(id: string): Promise<boolean>;
  softDeleteCustomer(id: string): Promise<boolean>;
  restoreCustomer(id: string): Promise<boolean>;
  getCustomerSalesCount(id: string): Promise<{ salesCount: number; returnsCount: number }>;
  getCustomerRecentSales(id: string, limit?: number): Promise<import("@shared/schema").Sale[]>;
  findOrCreateCustomer(name: string, phone: string, email?: string): Promise<import("@shared/schema").Customer | null>;
  getCustomerWithHistory(id: string): Promise<{
    customer: import("@shared/schema").Customer;
    totalSales: number;
    totalSpent: number;
    sales: import("@shared/schema").Sale[];
  } | undefined>;
  syncCustomerStats(params: { customerId?: string | null; customerPhone?: string | null }): Promise<void>;


  // Reports
  getNotSellingProducts(params: { sinceDays: number; fromDate?: Date; toDate?: Date }): Promise<
    Array<{
      productId: string;
      name: string;
      sku: string;
      stock: number;
      lastSoldAt: string | null;
      deleted_at: string | null;
      isDeleted: boolean;
    }>
  >;
  getStockValuation(): Promise<{
    totalCost: number;
    totalValuation: number;
    byProduct: Array<{
      productId: string;
      name: string;
      stock: number;
      costPrice: number;
      sellingPrice: number;
      totalCost: number;
      valuation: number;
    }>;
  }>;
  
  getProfitMargins(params: {
    sinceDays: number;
    fromDate?: Date;
    toDate?: Date;
  }): Promise<{
    totalProfit: number;
    byProduct: Array<{
      productId: string;
      name: string;
      quantity: number;
      revenue: number;
      cost: number;
      profit: number;
      marginPercent: number;
    }>;
  }>;

  // Payments
  createPayment(
    payment: import("@shared/schema").InsertPayment
  ): Promise<import("@shared/schema").Payment>;
  updatePayment(
    id: string,
    data: Partial<import("@shared/schema").InsertPayment>
  ): Promise<import("@shared/schema").Payment | undefined>;

  // Discount Coupons
  getDiscountCoupons(): Promise<import("@shared/schema").DiscountCoupon[]>;
  createDiscountCoupon(
    coupon: import("@shared/schema").InsertDiscountCoupon
  ): Promise<import("@shared/schema").DiscountCoupon>;
  getDiscountCouponByName(
    name: string
  ): Promise<import("@shared/schema").DiscountCoupon | undefined>;
  updateDiscountCoupon(
    id: string,
    coupon: Partial<import("@shared/schema").InsertDiscountCoupon>
  ): Promise<import("@shared/schema").DiscountCoupon | undefined>;
  deleteDiscountCoupon(id: string): Promise<boolean>;

  // Store & Billing Settings
  getStoreSettings(): Promise<StoreSettings>;
  updateStoreSettings(settings: Partial<StoreSettings>): Promise<StoreSettings>;
}

export { type StoreSettings, DEFAULT_STORE_SETTINGS } from "@/types/store-settings";

export const storage = new SupabaseStorage();
