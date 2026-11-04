-- ===========================================================================
-- CLOTHINV - Complete Database Schema Setup
-- ===========================================================================
-- This is the ONLY SQL file needed to setup the entire database
-- Run this in Supabase SQL editor to initialize all tables
-- ===========================================================================

-- ============================
-- 1. USERS TABLE
-- ============================
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'employee', -- admin or employee
  full_name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- 1B. USER SESSIONS TABLE (Max 2 Device Limit)
-- ============================
CREATE TABLE IF NOT EXISTS user_sessions (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  device_name TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_api_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_heartbeat_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  revoked_at TIMESTAMP,
  revocation_reason TEXT,
  pos_status TEXT DEFAULT 'ONLINE',
  current_pos_operation TEXT
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);



-- ============================
-- 2. CATEGORIES TABLE
-- ============================
CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT NOT NULL DEFAULT 'white',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- 3. PRODUCTS TABLE
-- ============================
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL,
  sku TEXT NOT NULL UNIQUE,
  category_id VARCHAR(36) REFERENCES categories(id) ON DELETE SET NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  buying_price DECIMAL(10, 2),
  size TEXT,
  stock INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER DEFAULT 5,
  barcode TEXT,
  is_bargainable BOOLEAN DEFAULT FALSE,
  min_price DECIMAL(10, 2),
  deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- 4. CUSTOMERS TABLE
-- ============================
CREATE TABLE IF NOT EXISTS customers (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- 5. SALES TABLE
-- ============================
CREATE TABLE IF NOT EXISTS sales (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id VARCHAR(36) NOT NULL REFERENCES users(id),
  customer_id VARCHAR(36),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  items JSONB NOT NULL, -- Array of {productId, quantity, price}
  subtotal DECIMAL(10, 2) NOT NULL,
  tax_percent DECIMAL(10, 2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  discount_type TEXT, -- 'percentage' or 'fixed'
  discount_value DECIMAL(10, 2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  salesperson_id VARCHAR(36),
  salesperson_name TEXT,
  invoice_number TEXT NOT NULL UNIQUE,
  deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- 5B. SALESPERSONS TABLE
-- ============================
CREATE TABLE IF NOT EXISTS salespersons (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL,
  code TEXT,
  phone TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- 6. SALE ITEMS TABLE (Normalized)
-- ============================
CREATE TABLE IF NOT EXISTS sale_items (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  sale_id VARCHAR(36) NOT NULL REFERENCES sales(id),
  product_id VARCHAR(36) NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  name TEXT NOT NULL, -- snapshot
  sku TEXT NOT NULL, -- snapshot
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- 7. SALES RETURNS TABLE
-- ============================
CREATE TABLE IF NOT EXISTS sales_returns (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  sale_id VARCHAR(36) NOT NULL REFERENCES sales(id),
  customer_id VARCHAR(36) REFERENCES customers(id),
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- 8. SALES RETURN ITEMS TABLE
-- ============================
CREATE TABLE IF NOT EXISTS sales_return_items (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  sales_return_id VARCHAR(36) NOT NULL REFERENCES sales_returns(id),
  sale_item_id VARCHAR(36) REFERENCES sale_items(id),
  product_id VARCHAR(36) NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  refund_amount DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- 9. STOCK MOVEMENTS TABLE
-- ============================
CREATE TABLE IF NOT EXISTS stock_movements (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  product_id VARCHAR(36) NOT NULL REFERENCES products(id),
  user_id VARCHAR(36) NOT NULL REFERENCES users(id),
  type TEXT NOT NULL, -- 'po_receipt' | 'sale_out' | 'return_in' | 'damage_out' | 'manual_adjust'
  quantity INTEGER NOT NULL,
  reason TEXT,
  ref_table TEXT, -- e.g., 'purchase_order_items', 'sale_items', 'sales_return_items'
  ref_id VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- 10. SYNC STATUS TABLE
-- ============================
CREATE TABLE IF NOT EXISTS sync_status (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  table_name TEXT NOT NULL,
  last_sync_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  pending_changes INTEGER DEFAULT 0
);

-- ============================
-- 11. SUPPLIERS TABLE
-- ============================
CREATE TABLE IF NOT EXISTS suppliers (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- 12. SUPPLIER PRODUCTS TABLE
-- ============================
CREATE TABLE IF NOT EXISTS supplier_products (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  supplier_id VARCHAR(36) NOT NULL REFERENCES suppliers(id),
  product_id VARCHAR(36) NOT NULL REFERENCES products(id),
  supplier_sku TEXT,
  default_cost DECIMAL(10, 2),
  lead_time_days INTEGER,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- 13. PURCHASE ORDERS TABLE
-- ============================
CREATE TABLE IF NOT EXISTS purchase_orders (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  supplier_id VARCHAR(36) NOT NULL REFERENCES suppliers(id),
  status TEXT NOT NULL DEFAULT 'draft', -- draft | ordered | received | closed
  expected_date TIMESTAMP,
  received_date TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- 14. PURCHASE ORDER ITEMS TABLE
-- ============================
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  purchase_order_id VARCHAR(36) NOT NULL REFERENCES purchase_orders(id),
  product_id VARCHAR(36) NOT NULL REFERENCES products(id),
  quantity_ordered INTEGER NOT NULL,
  quantity_received INTEGER NOT NULL DEFAULT 0,
  unit_cost DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- 15. PRODUCT COST HISTORY TABLE
-- ============================
CREATE TABLE IF NOT EXISTS product_cost_history (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  product_id VARCHAR(36) NOT NULL REFERENCES products(id),
  cost DECIMAL(10, 2) NOT NULL,
  source TEXT NOT NULL, -- 'PO' | 'manual'
  effective_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- 16. PRODUCT PRICE HISTORY TABLE
-- ============================
CREATE TABLE IF NOT EXISTS product_price_history (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  product_id VARCHAR(36) NOT NULL REFERENCES products(id),
  price DECIMAL(10, 2) NOT NULL,
  effective_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- 17. PROMOTIONS TABLE
-- ============================
CREATE TABLE IF NOT EXISTS promotions (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'percent' | 'fixed'
  value DECIMAL(10, 2) NOT NULL,
  starts_at TIMESTAMP,
  ends_at TIMESTAMP,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- 18. PROMOTION TARGETS TABLE
-- ============================
CREATE TABLE IF NOT EXISTS promotion_targets (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  promotion_id VARCHAR(36) NOT NULL REFERENCES promotions(id),
  target_type TEXT NOT NULL, -- 'product' | 'category'
  target_id VARCHAR(36) NOT NULL
);

-- ============================
-- 18b. CUSTOMERS TABLE
-- ============================
CREATE TABLE IF NOT EXISTS customers (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL,
  phone TEXT UNIQUE,
  email TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================
-- 19. DISCOUNT COUPONS TABLE
-- ============================
CREATE TABLE IF NOT EXISTS discount_coupons (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL UNIQUE,
  percentage DECIMAL(5, 2) NOT NULL, -- e.g., 10.00 for 10%
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(36) NOT NULL REFERENCES users(id)
);

-- ============================
-- 20. PAYMENTS TABLE (Razorpay, etc.)
-- ============================
CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  sale_id VARCHAR(36) NOT NULL REFERENCES sales(id),
  provider TEXT NOT NULL, -- 'razorpay'
  order_id TEXT,
  payment_id TEXT,
  status TEXT NOT NULL DEFAULT 'created', -- created | authorized | captured | failed | refunded
  amount DECIMAL(10, 2) NOT NULL,
  method TEXT, -- UPI | card | netbanking
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- 21. STORE SETTINGS TABLE
-- ============================
CREATE TABLE IF NOT EXISTS store_settings (
  id VARCHAR(36) PRIMARY KEY DEFAULT 'default_store',
  store_name TEXT NOT NULL DEFAULT 'Bhotiya Fabric Collection',
  address TEXT DEFAULT 'Moti Ganj, Bakebar Road, Bharthana',
  phone TEXT DEFAULT '+91 82736 89065',
  email TEXT DEFAULT '',
  gst_number TEXT DEFAULT '',
  tagline TEXT DEFAULT 'Quality Fabrics & Clothing',
  receipt_footer TEXT DEFAULT 'Thank you, Visit Again!',
  tax_enabled BOOLEAN DEFAULT FALSE,
  tax_percent DECIMAL(5, 2) DEFAULT 18.00,
  tax_label TEXT DEFAULT 'GST',
  tax_inclusive BOOLEAN DEFAULT FALSE,
  show_salesperson_on_bill BOOLEAN DEFAULT TRUE,
  whatsapp_template TEXT,
  instagram TEXT DEFAULT '',
  whatsapp_number TEXT DEFAULT '',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS show_salesperson_on_bill BOOLEAN DEFAULT TRUE;
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS subscription_expiry_date TIMESTAMP;

-- ============================
-- 22. BACKUP LOGS TABLE
-- ============================
CREATE TABLE IF NOT EXISTS backup_logs (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  status TEXT NOT NULL DEFAULT 'success',
  file_name TEXT,
  size_bytes BIGINT DEFAULT 0,
  trigger TEXT DEFAULT 'manual', -- 'cron' | 'manual'
  master_status TEXT,
  user_status TEXT,
  errors JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================================================
-- INDEXES FOR PERFORMANCE
-- ===========================================================================

-- Users
CREATE INDEX idx_users_username ON users(username);

-- Categories
CREATE INDEX idx_categories_name ON categories(name);

-- Products
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_deleted ON products(deleted);

-- Sales
CREATE INDEX idx_sales_user_id ON sales(user_id);
CREATE INDEX idx_sales_customer_id ON sales(customer_id);
CREATE INDEX idx_sales_invoice_number ON sales(invoice_number);
CREATE INDEX idx_sales_created_at ON sales(created_at);
CREATE INDEX idx_sales_deleted ON sales(deleted);

-- Customers
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_name ON customers(name);


-- Sale Items
CREATE INDEX idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product_id ON sale_items(product_id);

-- Sales Returns
CREATE INDEX idx_sales_returns_sale_id ON sales_returns(sale_id);
CREATE INDEX idx_sales_returns_customer_id ON sales_returns(customer_id);

-- Stock Movements
CREATE INDEX idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_user_id ON stock_movements(user_id);
CREATE INDEX idx_stock_movements_type ON stock_movements(type);

-- Suppliers
CREATE INDEX idx_supplier_products_supplier_id ON supplier_products(supplier_id);
CREATE INDEX idx_supplier_products_product_id ON supplier_products(product_id);

-- Purchase Orders
CREATE INDEX idx_purchase_orders_supplier_id ON purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(status);

-- Purchase Order Items
CREATE INDEX idx_po_items_po_id ON purchase_order_items(purchase_order_id);
CREATE INDEX idx_po_items_product_id ON purchase_order_items(product_id);

-- Cost & Price History
CREATE INDEX idx_cost_history_product_id ON product_cost_history(product_id);
CREATE INDEX idx_price_history_product_id ON product_price_history(product_id);

-- Promotions
CREATE INDEX idx_promotion_targets_promotion_id ON promotion_targets(promotion_id);

-- Discount Coupons
CREATE INDEX idx_coupons_name ON discount_coupons(name);
CREATE INDEX idx_coupons_active ON discount_coupons(active);

-- Payments
CREATE INDEX idx_payments_sale_id ON payments(sale_id);
CREATE INDEX idx_payments_status ON payments(status);

-- Store Settings & Backup Logs
CREATE INDEX idx_store_settings_id ON store_settings(id);
CREATE INDEX idx_backup_logs_created_at ON backup_logs(created_at);

-- ===========================================================================
-- ROW LEVEL SECURITY (Optional but recommended for Supabase)
-- ===========================================================================
-- Enable RLS on all tables (uncomment if needed)
/*
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_cost_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
*/

-- ===========================================================================
-- DONE! All tables are ready to use.
-- ===========================================================================
