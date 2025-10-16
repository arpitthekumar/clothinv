# Database Migration Instructions

## Fix Sales Table Missing Columns

The error you're seeing is because the `sales` table is missing the `deleted` and `deleted_at` columns that are needed for the soft delete functionality.

### Option 1: Run the Migration Script (Recommended)

1. Open your Supabase dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of `migration-add-sales-soft-delete.sql`
4. Run the script

### Option 2: Manual SQL Commands

Run these commands in your Supabase SQL Editor:

```sql
-- Add soft delete columns to sales table
ALTER TABLE sales 
ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL;

-- Add customer_id column if it doesn't exist
ALTER TABLE sales 
ADD COLUMN IF NOT EXISTS customer_id VARCHAR REFERENCES customers(id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sales_deleted ON sales(deleted);
CREATE INDEX IF NOT EXISTS idx_sales_deleted_at ON sales(deleted_at);

-- Update existing sales to have deleted = false
UPDATE sales SET deleted = FALSE WHERE deleted IS NULL;
```

### After Migration

Once you've run the migration, the sales management page should work properly with:
- ✅ Soft delete functionality
- ✅ Restore deleted sales
- ✅ Return/edit sales with inventory updates
- ✅ Proper search and filtering

The error should be resolved and all sales management features will be functional.

