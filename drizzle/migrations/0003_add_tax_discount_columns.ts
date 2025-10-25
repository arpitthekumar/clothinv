import { sql } from "drizzle-orm";
import { pgTable, decimal, text } from "drizzle-orm/pg-core";

// Add new columns to sales table
export const up = sql`
  ALTER TABLE sales
  ADD COLUMN subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN tax_percent DECIMAL(5, 2) DEFAULT 0,
  ADD COLUMN tax_amount DECIMAL(10, 2) DEFAULT 0,
  ADD COLUMN discount_type TEXT,
  ADD COLUMN discount_value DECIMAL(10, 2) DEFAULT 0,
  ADD COLUMN discount_amount DECIMAL(10, 2) DEFAULT 0;
`;

// Remove columns if needed to rollback
export const down = sql`
  ALTER TABLE sales
  DROP COLUMN subtotal,
  DROP COLUMN tax_percent,
  DROP COLUMN tax_amount,
  DROP COLUMN discount_type,
  DROP COLUMN discount_value,
  DROP COLUMN discount_amount;
`;