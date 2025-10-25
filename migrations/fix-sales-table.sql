-- Run this in Supabase SQL editor to fix the sales table
DROP TABLE IF EXISTS sales CASCADE;

CREATE TABLE sales (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR REFERENCES users(id) NOT NULL,
    customer_name TEXT NOT NULL DEFAULT 'Walk-in Customer',
    customer_phone TEXT NOT NULL DEFAULT 'N/A',
    items JSONB NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
    tax_percent DECIMAL(5, 2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    discount_type TEXT,
    discount_value DECIMAL(10, 2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    payment_method TEXT NOT NULL DEFAULT 'cash',
    invoice_number TEXT NOT NULL UNIQUE,
    deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Recreate indexes
CREATE INDEX idx_sales_deleted ON sales(deleted);
CREATE INDEX idx_sales_deleted_at ON sales(deleted_at);
CREATE INDEX idx_sales_user_id ON sales(user_id);
CREATE INDEX idx_sales_created_at ON sales(created_at);