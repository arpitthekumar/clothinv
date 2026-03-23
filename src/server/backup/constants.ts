/**
 * Curated tables from SETUP_DATABASE.sql + src/server/storage.supabase.ts.
 * Used when OpenAPI discovery fails and as the base merge set for exports.
 */
export const CANONICAL_PUBLIC_TABLES: readonly string[] = [
  "users",
  "categories",
  "suppliers",
  "customers",
  "products",
  "supplier_products",
  "promotions",
  "promotion_targets",
  "purchase_orders",
  "purchase_order_items",
  "sales",
  "sale_items",
  "payments",
  "sales_returns",
  "sales_return_items",
  "stock_movements",
  "product_cost_history",
  "product_price_history",
  "discount_coupons",
  "sync_status",
] as const;

/**
 * FK-safe insert order for this schema. Unknown tables (from discovery) are restored
 * after this list, sorted alphabetically — may fail if they reference each other.
 */
export const RESTORE_INSERT_ORDER: readonly string[] = [
  "users",
  "categories",
  "suppliers",
  "customers",
  "products",
  "supplier_products",
  "promotions",
  "promotion_targets",
  "purchase_orders",
  "purchase_order_items",
  "sales",
  "sale_items",
  "payments",
  "sales_returns",
  "sales_return_items",
  "stock_movements",
  "product_cost_history",
  "product_price_history",
  "discount_coupons",
  "sync_status",
];

/** Delete children before parents (reverse of restore insert order). */
export const RESTORE_DELETE_ORDER: readonly string[] = [
  ...RESTORE_INSERT_ORDER,
].reverse();

const orderIndex = new Map<string, number>(
  RESTORE_INSERT_ORDER.map((name, i) => [name, i])
);

/** Ordered list for restore: known order first, then unknowns A–Z. */
export function sortTablesForRestore(names: string[]): string[] {
  const unknown: string[] = [];
  const known: string[] = [];

  for (const n of names) {
    if (orderIndex.has(n)) known.push(n);
    else unknown.push(n);
  }

  known.sort((a, b) => (orderIndex.get(a)! - orderIndex.get(b)!));
  unknown.sort((a, b) => a.localeCompare(b));
  return [...known, ...unknown];
}
