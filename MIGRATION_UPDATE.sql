-- ============================================================================
-- SAFE NON-DESTRUCTIVE DATABASE MIGRATION SCRIPT
-- Upgrade clothinv database to support latest features from wtscloth
-- (Store settings, Device session tracking, Salespersons, Customers,
--  POS bargaining system, Backup logs, and Subscription guard)
--
-- ZERO DATA LOSS: This script strictly uses IF NOT EXISTS and ADD COLUMN IF NOT EXISTS.
-- Run this in the Supabase Dashboard SQL Editor for your project.
-- ============================================================================

-- 1. USER SESSIONS (POS Device management & session limits)
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

-- 2. SALESPERSONS TABLE
CREATE TABLE IF NOT EXISTS salespersons (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL,
  code TEXT,
  phone TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. STORE SETTINGS TABLE
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
  subscription_expiry_date TIMESTAMP,
  subscription_rate_6_months DECIMAL(10, 2) DEFAULT 2500,
  last_payment_amount DECIMAL(10, 2) DEFAULT 2500,
  last_payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_payment_months INTEGER DEFAULT 6,
  backup_frequency TEXT DEFAULT 'weekly',
  max_allowed_employees INTEGER DEFAULT 3,
  max_allowed_admins INTEGER DEFAULT 2,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ensure all columns exist on store_settings if table was already created
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS show_salesperson_on_bill BOOLEAN DEFAULT TRUE;
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS subscription_expiry_date TIMESTAMP;
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS subscription_rate_6_months DECIMAL(10, 2) DEFAULT 2500;
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS last_payment_amount DECIMAL(10, 2) DEFAULT 2500;
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS last_payment_months INTEGER DEFAULT 6;
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS backup_frequency TEXT DEFAULT 'weekly';
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS max_allowed_employees INTEGER DEFAULT 3;
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS max_allowed_admins INTEGER DEFAULT 2;

CREATE INDEX IF NOT EXISTS idx_store_settings_id ON store_settings(id);

-- Seed default settings row if not present
INSERT INTO store_settings (
  id, store_name, address, phone, email, gst_number, tagline, receipt_footer,
  tax_enabled, tax_percent, tax_label, tax_inclusive, show_salesperson_on_bill,
  subscription_expiry_date, subscription_rate_6_months, last_payment_amount,
  last_payment_date, last_payment_months, backup_frequency, max_allowed_employees, max_allowed_admins
) VALUES (
  'default_store',
  'Bhotiya Fabric Collection',
  'Moti Ganj, Bakebar Road, Bharthana',
  '+91 82736 89065',
  '',
  '',
  'Quality Fabrics & Clothing',
  'Thank you, Visit Again!',
  FALSE,
  18.00,
  'GST',
  FALSE,
  TRUE,
  CURRENT_TIMESTAMP + INTERVAL '180 days',
  2500,
  2500,
  CURRENT_TIMESTAMP,
  6,
  'weekly',
  3,
  2
) ON CONFLICT (id) DO NOTHING;

-- 4. BACKUP LOGS TABLE
CREATE TABLE IF NOT EXISTS backup_logs (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  status TEXT NOT NULL DEFAULT 'success',
  file_name TEXT,
  size_bytes BIGINT DEFAULT 0,
  trigger TEXT DEFAULT 'manual',
  master_status TEXT,
  user_status TEXT,
  errors JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_backup_logs_created_at ON backup_logs(created_at);

-- 5. PRODUCTS: Add POS bargaining and pricing fields
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_bargainable BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS min_price DECIMAL(10, 2);

-- 6. CUSTOMERS: Add soft delete and update timestamps
ALTER TABLE customers ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);

-- 7. SALES: Add salesperson attribution
ALTER TABLE sales ADD COLUMN IF NOT EXISTS salesperson_id VARCHAR(36);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS salesperson_name TEXT;

-- 8. CATEGORY FK SAFE BEHAVIOR (ON DELETE SET NULL)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'products_category_id_fkey'
      AND table_name = 'products'
  ) THEN
    ALTER TABLE products DROP CONSTRAINT products_category_id_fkey;
    ALTER TABLE products ADD CONSTRAINT products_category_id_fkey
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Completed successfully.
