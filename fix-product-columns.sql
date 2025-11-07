-- Fix product table column names to match Supabase schema expectations
-- Run this in your Supabase SQL Editor

-- Fix categoryld typo to category_id (if it exists)
DO $$ 
BEGIN
    -- Check if categoryld exists and rename it
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'categoryld'
    ) THEN
        ALTER TABLE products RENAME COLUMN categoryld TO category_id;
    END IF;
END $$;

-- Ensure min_stock exists (snake_case)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'min_stock'
    ) THEN
        -- Check if minStock exists and rename it
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'products' AND column_name = 'minStock'
        ) THEN
            ALTER TABLE products RENAME COLUMN "minStock" TO min_stock;
        ELSE
            ALTER TABLE products ADD COLUMN min_stock INTEGER DEFAULT 5;
        END IF;
    END IF;
END $$;

-- Ensure buying_price exists
ALTER TABLE products ADD COLUMN IF NOT EXISTS buying_price DECIMAL(10, 2);

-- Ensure created_at exists (snake_case)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'created_at'
    ) THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'products' AND column_name = 'createdAt'
        ) THEN
            ALTER TABLE products RENAME COLUMN "createdAt" TO created_at;
        ELSE
            ALTER TABLE products ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
        END IF;
    END IF;
END $$;

-- Ensure updated_at exists (snake_case)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'updated_at'
    ) THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'products' AND column_name = 'updatedAt'
        ) THEN
            ALTER TABLE products RENAME COLUMN "updatedAt" TO updated_at;
        ELSE
            ALTER TABLE products ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
        END IF;
    END IF;
END $$;

-- Ensure deleted_at exists (snake_case)
ALTER TABLE products ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL;

