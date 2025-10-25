-- First, handle existing data to prevent NOT NULL constraint violations
UPDATE sales 
SET 
  user_id = COALESCE(user_id, NULL),
  customer_name = COALESCE(customer_name, 'Walk-in Customer'),
  customer_phone = COALESCE(customer_phone, 'N/A'),
  items = COALESCE(items, '[]'::jsonb),
  subtotal = COALESCE(subtotal, '0')::numeric,
  tax_percent = COALESCE(tax_percent, '0')::numeric,
  tax_amount = COALESCE(tax_amount, '0')::numeric,
  discount_type = COALESCE(discount_type, NULL),
  discount_value = COALESCE(discount_value, '0')::numeric,
  discount_amount = COALESCE(discount_amount, '0')::numeric,
  total_amount = COALESCE(total_amount, '0')::numeric,
  payment_method = COALESCE(payment_method, 'cash'),
  invoice_number = COALESCE(invoice_number, CONCAT('INV-', id));

-- Drop existing columns and recreate them with correct types and constraints
ALTER TABLE sales 
  DROP COLUMN IF EXISTS user_id CASCADE,
  DROP COLUMN IF EXISTS customer_name CASCADE,
  DROP COLUMN IF EXISTS customer_phone CASCADE,A
  DROP COLUMN IF EXISTS items CASCADE,
  DROP COLUMN IF EXISTS subtotal CASCADE,
  DROP COLUMN IF EXISTS tax_percent CASCADE,
  DROP COLUMN IF EXISTS tax_amount CASCADE,
  DROP COLUMN IF EXISTS discount_type CASCADE,
  DROP COLUMN IF EXISTS discount_value CASCADE,
  DROP COLUMN IF EXISTS discount_amount CASCADE,
  DROP COLUMN IF EXISTS total_amount CASCADE,
  DROP COLUMN IF EXISTS payment_method CASCADE,
  DROP COLUMN IF EXISTS invoice_number CASCADE;

-- Add columns back with correct types and constraints
ALTER TABLE sales 
  ADD COLUMN user_id VARCHAR,
  ADD COLUMN customer_name TEXT NOT NULL DEFAULT 'Walk-in Customer',
  ADD COLUMN customer_phone TEXT NOT NULL DEFAULT 'N/A',
  ADD COLUMN items JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN subtotal NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN tax_percent NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN tax_amount NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN discount_type TEXT NULL,
  ADD COLUMN discount_value NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN discount_amount NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN total_amount NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN payment_method TEXT NOT NULL DEFAULT 'cash',
  ADD COLUMN invoice_number TEXT NOT NULL DEFAULT 'INV-0';

-- Create indexes for better performance
DROP INDEX IF EXISTS idx_sales_customer_name;
DROP INDEX IF EXISTS idx_sales_customer_phone;
CREATE INDEX idx_sales_customer_name ON sales(customer_name);
CREATE INDEX idx_sales_customer_phone ON sales(customer_phone);