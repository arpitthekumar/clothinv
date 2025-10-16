-- Supabase Database Schema Setup
-- Run this script in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'employee',
    full_name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    sku TEXT NOT NULL UNIQUE,
    category_id VARCHAR REFERENCES categories(id),
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    size TEXT,
    stock INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER DEFAULT 5,
    barcode TEXT,
    deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Sales table
CREATE TABLE IF NOT EXISTS sales (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR REFERENCES users(id) NOT NULL,
    customer_id VARCHAR REFERENCES customers(id),
    items JSONB NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'cash',
    invoice_number TEXT NOT NULL UNIQUE,
    deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for sales table
CREATE INDEX IF NOT EXISTS idx_sales_deleted ON sales(deleted);
CREATE INDEX IF NOT EXISTS idx_sales_deleted_at ON sales(deleted_at);

-- Stock movements table
CREATE TABLE IF NOT EXISTS stock_movements (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id VARCHAR REFERENCES products(id) NOT NULL,
    user_id VARCHAR REFERENCES users(id) NOT NULL,
    type TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    reason TEXT,
    ref_table TEXT,
    ref_id VARCHAR,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Sync status table
CREATE TABLE IF NOT EXISTS sync_status (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    last_sync_at TIMESTAMP DEFAULT NOW(),
    pending_changes INTEGER DEFAULT 0
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_deleted ON products(deleted);
CREATE INDEX IF NOT EXISTS idx_sales_user_id ON sales(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_user_id ON stock_movements(user_id);

-- Insert a default admin user (password: admin123)
INSERT INTO users (username, password, role, full_name) 
VALUES ('admin', '$2b$10$rYvMwkzP1nVfQ.ePZKxM/.OC8O5vQXJ5VZLFbTl2YBv8LH.GJ7K0m', 'admin', 'System Administrator')
ON CONFLICT (username) DO NOTHING;

-- Insert some default categories
INSERT INTO categories (name, description) VALUES 
('Shirts', 'Various types of shirts'),
('Pants', 'Trousers and jeans'),
('Accessories', 'Belts, ties, and other accessories')
ON CONFLICT (name) DO NOTHING;

-- NEW TABLES FOR PURCHASING, PRICING, PROMOTIONS, RETURNS, PAYMENTS

-- Customers
CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Supplier products mapping
CREATE TABLE IF NOT EXISTS supplier_products (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id VARCHAR REFERENCES suppliers(id) NOT NULL,
    product_id VARCHAR REFERENCES products(id) NOT NULL,
    supplier_sku TEXT,
    default_cost DECIMAL(10,2),
    lead_time_days INTEGER,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Purchase Orders
CREATE TABLE IF NOT EXISTS purchase_orders (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id VARCHAR REFERENCES suppliers(id) NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    expected_date TIMESTAMP,
    received_date TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Purchase Order Items
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id VARCHAR REFERENCES purchase_orders(id) NOT NULL,
    product_id VARCHAR REFERENCES products(id) NOT NULL,
    quantity_ordered INTEGER NOT NULL,
    quantity_received INTEGER NOT NULL DEFAULT 0,
    unit_cost DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Product cost history
CREATE TABLE IF NOT EXISTS product_cost_history (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id VARCHAR REFERENCES products(id) NOT NULL,
    cost DECIMAL(10,2) NOT NULL,
    source TEXT NOT NULL,
    effective_at TIMESTAMP DEFAULT NOW()
);

-- Product price history
CREATE TABLE IF NOT EXISTS product_price_history (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id VARCHAR REFERENCES products(id) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    effective_at TIMESTAMP DEFAULT NOW()
);

-- Promotions
CREATE TABLE IF NOT EXISTS promotions (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    starts_at TIMESTAMP,
    ends_at TIMESTAMP,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Promotion targets
CREATE TABLE IF NOT EXISTS promotion_targets (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    promotion_id VARCHAR REFERENCES promotions(id) NOT NULL,
    target_type TEXT NOT NULL,
    target_id VARCHAR NOT NULL
);

-- Sale items (normalized)
CREATE TABLE IF NOT EXISTS sale_items (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id VARCHAR REFERENCES sales(id) NOT NULL,
    product_id VARCHAR REFERENCES products(id) NOT NULL,
    quantity INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    name TEXT NOT NULL,
    sku TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Sales returns
CREATE TABLE IF NOT EXISTS sales_returns (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id VARCHAR REFERENCES sales(id) NOT NULL,
    customer_id VARCHAR REFERENCES customers(id),
    reason TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Sales return items
CREATE TABLE IF NOT EXISTS sales_return_items (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    sales_return_id VARCHAR REFERENCES sales_returns(id) NOT NULL,
    sale_item_id VARCHAR REFERENCES sale_items(id),
    product_id VARCHAR REFERENCES products(id) NOT NULL,
    quantity INTEGER NOT NULL,
    refund_amount DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id VARCHAR REFERENCES sales(id) NOT NULL,
    provider TEXT NOT NULL,
    order_id TEXT,
    payment_id TEXT,
    status TEXT NOT NULL DEFAULT 'created',
    amount DECIMAL(10,2) NOT NULL,
    method TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add customer_id to sales if not exists
ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_id VARCHAR REFERENCES customers(id);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_po_supplier ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_poi_po ON purchase_order_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_poi_product ON purchase_order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items(product_id);
CREATE INDEX IF NOT EXISTS idx_payments_sale ON payments(sale_id);
