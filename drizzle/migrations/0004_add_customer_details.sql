-- Add customer details columns to sales table
ALTER TABLE sales
  ADD COLUMN customer_name TEXT,
  ADD COLUMN customer_phone TEXT;

-- Add indexes for better query performance
CREATE INDEX idx_sales_customer_phone ON sales(customer_phone);
CREATE INDEX idx_sales_created_at ON sales(created_at);