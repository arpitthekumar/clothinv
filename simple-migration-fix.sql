-- Simple Database Schema Fix
-- Run this in your Supabase SQL Editor

-- 1. Fix stock_movements table structure
DROP TABLE IF EXISTS stock_movements CASCADE;

CREATE TABLE stock_movements (
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

-- 2. Ensure sale_items table exists
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

-- 3. Ensure sales_returns table exists
CREATE TABLE IF NOT EXISTS sales_returns (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id VARCHAR REFERENCES sales(id) NOT NULL,
    customer_id VARCHAR REFERENCES customers(id),
    reason TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Ensure sales_return_items table exists
CREATE TABLE IF NOT EXISTS sales_return_items (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    sales_return_id VARCHAR REFERENCES sales_returns(id) NOT NULL,
    sale_item_id VARCHAR REFERENCES sale_items(id),
    product_id VARCHAR REFERENCES products(id) NOT NULL,
    quantity INTEGER NOT NULL,
    refund_amount DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Add missing columns to sales table
ALTER TABLE sales 
ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS customer_id VARCHAR REFERENCES customers(id);

-- 6. Create all necessary indexes
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_user ON stock_movements(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(type);

CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items(product_id);

CREATE INDEX IF NOT EXISTS idx_sales_returns_sale ON sales_returns(sale_id);
CREATE INDEX IF NOT EXISTS idx_sales_return_items_return ON sales_return_items(sales_return_id);
CREATE INDEX IF NOT EXISTS idx_sales_return_items_product ON sales_return_items(product_id);

CREATE INDEX IF NOT EXISTS idx_sales_deleted ON sales(deleted);
CREATE INDEX IF NOT EXISTS idx_sales_deleted_at ON sales(deleted_at);

-- 7. Update existing sales to have deleted = false
UPDATE sales SET deleted = FALSE WHERE deleted IS NULL;

-- Note: We'll create sale_items records manually for existing sales
-- or let the system create them as needed for new sales


