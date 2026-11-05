import { Client } from "pg";

async function main() {
  const client = new Client({
    user: "postgres",
    password: "wts@cloth@inv",
    host: "db.qplkfefmifxpdinberwo.supabase.co",
    port: 5432,
    database: "postgres",
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log("Connected to PostgreSQL.");

    console.log("Checking and renaming legacy camelCase columns...");
    await client.query(`
      DO $$ 
      BEGIN
        -- 1. products: categoryId -> category_id
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'categoryId'
        ) THEN
          ALTER TABLE products RENAME COLUMN "categoryId" TO category_id;
          RAISE NOTICE 'Renamed products.categoryId to category_id';
        END IF;

        -- 2. products: minStock -> min_stock
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'minStock'
        ) THEN
          ALTER TABLE products RENAME COLUMN "minStock" TO min_stock;
          RAISE NOTICE 'Renamed products.minStock to min_stock';
        END IF;

        -- 3. products: createdAt -> created_at
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'createdAt'
        ) THEN
          ALTER TABLE products RENAME COLUMN "createdAt" TO created_at;
          RAISE NOTICE 'Renamed products.createdAt to created_at';
        END IF;

        -- 4. products: updatedAt -> updated_at
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'updatedAt'
        ) THEN
          ALTER TABLE products RENAME COLUMN "updatedAt" TO updated_at;
          RAISE NOTICE 'Renamed products.updatedAt to updated_at';
        END IF;

        -- 5. categories: createdAt -> created_at
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = 'categories' AND column_name = 'createdAt'
        ) THEN
          ALTER TABLE categories RENAME COLUMN "createdAt" TO created_at;
          RAISE NOTICE 'Renamed categories.createdAt to created_at';
        END IF;

        -- 6. users: fullName -> full_name
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'fullName'
        ) THEN
          ALTER TABLE users RENAME COLUMN "fullName" TO full_name;
          RAISE NOTICE 'Renamed users.fullName to full_name';
        END IF;

        -- 7. users: createdAt -> created_at
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'createdAt'
        ) THEN
          ALTER TABLE users RENAME COLUMN "createdAt" TO created_at;
          RAISE NOTICE 'Renamed users.createdAt to created_at';
        END IF;
      END $$;
    `);
    console.log("Column renames executed successfully.");

    console.log("Creating category_id index on products if not exists...");
    await client.query("CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);");

    console.log("Notifying PostgREST to reload schema cache...");
    await client.query("NOTIFY pgrst, 'reload schema';");
    console.log("PostgREST reload notified.");

    // Verify products table columns
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'products'
      ORDER BY ordinal_position;
    `);
    console.log("New products columns:", res.rows.map(r => r.column_name));

    // Verify row count unchanged
    const countRes = await client.query("SELECT COUNT(*) FROM products;");
    console.log("Product count verification:", countRes.rows[0].count);

    await client.end();
  } catch (err: any) {
    console.error("Migration error:", err.message);
    try { await client.end(); } catch (_) {}
    process.exit(1);
  }
}

main();
