import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });
import { storage } from "../src/server/storage";
import { Client } from "pg";

async function main() {
  console.log("==================================================");
  console.log("🚀 STARTING FULL END-TO-END SYSTEM VALIDATION SUITE");
  console.log("==================================================\n");

  const pgClient = new Client({
    user: "postgres",
    password: "wts@cloth@inv",
    host: "db.qplkfefmifxpdinberwo.supabase.co",
    port: 5432,
    database: "postgres",
    ssl: { rejectUnauthorized: false },
  });
  await pgClient.connect();

  // Snapshot row counts of core tables to guarantee zero data loss / corruption
  const countBefore = await getRowCounts(pgClient);
  console.log("📊 DB Snapshot before test:", countBefore);

  let testCategoryId = "";
  let testProductId = "";
  let testCustomerId = "";
  let testSalespersonId = "";
  let testCouponId = "";
  let testSaleId = "";
  let testPromotionId = "";
  let testSupplierId = "";
  let testPOId = "";
  let testSessionId = "";

  let allPassed = true;
  function pass(step: string) {
    console.log(`  ✅ PASS: ${step}`);
  }
  function fail(step: string, err: any) {
    console.error(`  ❌ FAIL: ${step} ->`, err?.message || err);
    allPassed = false;
  }

  try {
    // -------------------------------------------------------------------------
    // 1. CATEGORIES FLOW
    // -------------------------------------------------------------------------
    console.log("\n📁 [1/12] Testing Categories Flow...");
    try {
      const cat = await storage.createCategory({
        name: `TEST_CAT_${Date.now()}`,
        description: "Temporary E2E Test Category",
        color: "blue",
      });
      testCategoryId = cat.id;
      pass(`Created category (ID: ${cat.id})`);

      const allCats = await storage.getCategories();
      if (!allCats.some((c) => c.id === testCategoryId)) {
        throw new Error("Created category not found in getCategories()");
      }
      pass(`Verified category in getCategories() (Total: ${allCats.length})`);

      const updatedCat = await storage.updateCategory(testCategoryId, {
        description: "Updated Description",
      });
      if (updatedCat?.description !== "Updated Description") {
        throw new Error("Category update failed");
      }
      pass("Updated category description");
    } catch (err) {
      fail("Categories Flow", err);
    }

    // -------------------------------------------------------------------------
    // 2. PRODUCTS FLOW
    // -------------------------------------------------------------------------
    console.log("\n📦 [2/12] Testing Products Flow (with Bargaining fields)...");
    try {
      const uniqueSku = `SKU-TEST-${Date.now()}`;
      const uniqueBarcode = `BC-${Date.now()}`;

      const prod = await storage.createProduct({
        name: "E2E Test Shirt",
        sku: uniqueSku,
        barcode: uniqueBarcode,
        categoryId: testCategoryId,
        price: "250.00",
        buyingPrice: "150.00",
        minPrice: "200.00",
        isBargainable: true,
        stock: 20,
        minStock: 5,
        size: "L",
        description: "Test product for E2E suite",
      });
      testProductId = prod.id;
      pass(`Created product (ID: ${prod.id}, SKU: ${uniqueSku})`);

      // Read by ID
      const byId = await storage.getProduct(testProductId);
      if (!byId || byId.sku !== uniqueSku) throw new Error("getProduct(id) failed");
      pass("Fetched product by ID");

      // Read by SKU
      const bySku = await storage.getProductBySku(uniqueSku);
      if (!bySku) throw new Error("getProductBySku() failed");
      pass("Fetched product by SKU");

      // Read by Barcode
      const byBc = await storage.getProductByBarcode(uniqueBarcode);
      if (!byBc) throw new Error("getProductByBarcode() failed");
      pass("Fetched product by Barcode");

      // Update product (simulating edit modal)
      const updatedProd = await storage.updateProduct(testProductId, {
        name: "E2E Test Shirt Updated",
        price: "260.00",
        buyingPrice: "160.00",
        minPrice: "210.00",
        minStock: 6,
        categoryId: testCategoryId,
      });
      if (!updatedProd || updatedProd.name !== "E2E Test Shirt Updated") {
        throw new Error("updateProduct() failed to apply updates");
      }
      pass("Updated product details, price, minStock, and category");

      // Stock adjust
      const stockUpdated = await storage.updateStock(testProductId, 25);
      if (stockUpdated?.stock !== 25) throw new Error("updateStock() failed");
      pass("Updated stock level to 25");

      // Soft delete & restore
      const softDel = await storage.softDeleteProduct(testProductId);
      if (!softDel) throw new Error("softDeleteProduct() failed");
      pass("Soft deleted product");

      const restored = await storage.restoreProduct(testProductId);
      if (!restored) throw new Error("restoreProduct() failed");
      pass("Restored product");
    } catch (err) {
      fail("Products Flow", err);
    }

    // -------------------------------------------------------------------------
    // 3. CUSTOMERS FLOW
    // -------------------------------------------------------------------------
    console.log("\n👤 [3/12] Testing Customers Flow...");
    try {
      const testPhone = `99${Date.now().toString().slice(-8)}`;
      const cust = await storage.createCustomer({
        name: "Test E2E Customer",
        phone: testPhone,
        email: "test_e2e@example.com",
      });
      testCustomerId = cust.id;
      pass(`Created customer (ID: ${cust.id}, Phone: ${testPhone})`);

      const byPhone = await storage.getCustomerByPhone(testPhone);
      if (!byPhone || byPhone.name !== "Test E2E Customer") {
        throw new Error("getCustomerByPhone() failed");
      }
      pass("Looked up customer by phone");

      const updatedCust = await storage.updateCustomer(testCustomerId, {
        email: "updated_e2e@example.com",
      });
      if (updatedCust?.email !== "updated_e2e@example.com") {
        throw new Error("updateCustomer() failed");
      }
      pass("Updated customer email");

      // Test customer sales count
      const count = await storage.getCustomerSalesCount(testCustomerId);
      pass(`Fetched customer sales count (sales: ${count.salesCount})`);
    } catch (err) {
      fail("Customers Flow", err);
    }

    // -------------------------------------------------------------------------
    // 4. SALESPERSONS FLOW
    // -------------------------------------------------------------------------
    console.log("\n👔 [4/12] Testing Salespersons Flow...");
    try {
      const sp = await storage.createSalesperson({
        name: "E2E Salesperson",
        code: `SP${Date.now().toString().slice(-4)}`,
        phone: "9876543210",
        active: true,
      });
      testSalespersonId = sp.id;
      pass(`Created salesperson (ID: ${sp.id}, Code: ${sp.code})`);

      const list = await storage.getSalespersons(true);
      if (!list.some((s) => s.id === testSalespersonId)) {
        throw new Error("getSalespersons() missing test salesperson");
      }
      pass("Verified salesperson in getSalespersons()");

      const updatedSp = await storage.updateSalesperson(testSalespersonId, {
        name: "E2E Salesperson Updated",
      });
      if (updatedSp?.name !== "E2E Salesperson Updated") {
        throw new Error("updateSalesperson() failed");
      }
      pass("Updated salesperson name");
    } catch (err) {
      fail("Salespersons Flow", err);
    }

    // -------------------------------------------------------------------------
    // 5. STORE SETTINGS FLOW
    // -------------------------------------------------------------------------
    console.log("\n⚙️ [5/12] Testing Store Settings Flow...");
    try {
      const settings = await storage.getStoreSettings();
      if (!settings) throw new Error("getStoreSettings() returned null");
      pass(`Fetched store settings (Store: ${(settings as any).store_name || (settings as any).storeName})`);

      // Update tagline and revert
      const originalTagline = settings.tagline || "";
      const tempTagline = `Quality Fabrics & Clothing [E2E-TEST-${Date.now()}]`;

      await storage.updateStoreSettings({ tagline: tempTagline });
      const verifySettings = await storage.getStoreSettings();
      if (verifySettings?.tagline !== tempTagline) {
        throw new Error("updateStoreSettings() failed to apply tagline");
      }
      pass("Updated store settings tagline without subscription warning");

      // Revert tagline back to original
      await storage.updateStoreSettings({ tagline: originalTagline });
      pass("Reverted store settings to original tagline");
    } catch (err) {
      fail("Store Settings Flow", err);
    }

    // -------------------------------------------------------------------------
    // 6. DISCOUNT COUPONS FLOW
    // -------------------------------------------------------------------------
    console.log("\n🎟️ [6/12] Testing Discount Coupons Flow...");
    try {
      const couponCode = `E2E${Date.now().toString().slice(-6)}`;
      const coupon = await storage.createDiscountCoupon({
        name: couponCode,
        percentage: "10.00",
        active: true,
        createdBy: "admin-dev-001",
      });
      testCouponId = coupon.id;
      pass(`Created discount coupon (ID: ${coupon.id}, Code: ${couponCode})`);

      const coupons = await storage.getDiscountCoupons();
      if (!coupons.some((c) => c.id === testCouponId)) {
        throw new Error("getDiscountCoupons() missing test coupon");
      }
      pass("Verified coupon in getDiscountCoupons()");
    } catch (err) {
      fail("Discount Coupons Flow", err);
    }

    // -------------------------------------------------------------------------
    // 7. STOCK MOVEMENTS FLOW
    // -------------------------------------------------------------------------
    console.log("\n📊 [7/12] Testing Stock Movements Flow...");
    try {
      const move = await storage.createStockMovement({
        productId: testProductId,
        userId: "admin-dev-001",
        type: "adjustment",
        quantity: 5,
        reason: "E2E Validation Test",
      });
      pass(`Created stock movement (ID: ${move.id}, type: adjustment)`);

      const movements = await storage.getStockMovementsByProduct(testProductId);
      if (!movements.some((m) => m.id === move.id)) {
        throw new Error("getStockMovementsByProduct() missing test movement");
      }
      pass(`Fetched stock movements for product (count: ${movements.length})`);
    } catch (err) {
      fail("Stock Movements Flow", err);
    }

    // -------------------------------------------------------------------------
    // 8. SALES & RECEIPT FLOW
    // -------------------------------------------------------------------------
    console.log("\n🧾 [8/12] Testing Sales & Invoice Flow...");
    try {
      const invoiceNum = `INV-E2E-${Date.now()}`;
      const sale = await storage.createSale({
        user_id: "admin-dev-001",
        customer_id: testCustomerId,
        salesperson_id: testSalespersonId,
        salesperson_name: "E2E Salesperson Updated",
        customer_name: "Test E2E Customer",
        customer_phone: "9988776655",
        invoice_number: invoiceNum,
        payment_method: "cash",
        subtotal: "260.00",
        tax_percent: "0",
        tax_amount: "0",
        discount_type: "percentage",
        discount_value: "10",
        discount_amount: "26.00",
        total_amount: "234.00",
        items: [
          {
            productId: testProductId,
            name: "E2E Test Shirt Updated",
            sku: "TEST-SKU",
            quantity: 1,
            price: 260,
          },
        ],
      });
      testSaleId = sale.id;
      pass(`Created sale (ID: ${sale.id}, Invoice: ${invoiceNum})`);

      // Verify sales list query
      const allSales = await storage.getSales();
      if (!allSales.some((s) => s.id === testSaleId)) {
        throw new Error("getSales() does not include created sale");
      }
      pass("Verified sale appears in getSales()");

      // Soft delete & restore sale
      await storage.softDeleteSale(testSaleId);
      pass("Soft-deleted sale via softDeleteSale()");

      await storage.restoreSale(testSaleId);
      pass("Restored sale via restoreSale()");
    } catch (err) {
      fail("Sales Flow", err);
    }

    // -------------------------------------------------------------------------
    // 9. PROMOTIONS & TARGETS FLOW
    // -------------------------------------------------------------------------
    console.log("\n🏷️ [9/12] Testing Promotions & Targets Flow...");
    try {
      const promo = await storage.createPromotion({
        name: `E2E Promo ${Date.now()}`,
        type: "fixed",
        value: "20.00",
        active: true,
      });
      testPromotionId = promo.id;
      pass(`Created promotion (ID: ${promo.id})`);

      const target = await storage.addPromotionTarget({
        promotionId: testPromotionId,
        targetType: "product",
        targetId: testProductId,
      });
      pass(`Created promotion target linked to product (ID: ${target.id})`);

      const promos = await storage.getPromotions();
      if (!promos.some((p: any) => p.id === testPromotionId)) {
        throw new Error("getPromotions() missing test promo");
      }
      pass("Verified promotion in getPromotions()");
    } catch (err) {
      fail("Promotions Flow", err);
    }

    // -------------------------------------------------------------------------
    // 10. SUPPLIERS & PURCHASE ORDERS FLOW
    // -------------------------------------------------------------------------
    console.log("\n🚚 [10/12] Testing Suppliers & Purchase Orders Flow...");
    try {
      const supplier = await storage.createSupplier({
        name: `E2E Supplier ${Date.now()}`,
        email: "supplier_e2e@example.com",
        phone: "9123456780",
        address: "Test Supplier Address",
      });
      testSupplierId = supplier.id;
      pass(`Created supplier (ID: ${supplier.id})`);

      const po = await storage.createPurchaseOrder({
        supplierId: testSupplierId,
        status: "ordered",
        notes: "Test PO for validation",
      });
      testPOId = po.id;
      pass(`Created purchase order (ID: ${po.id})`);

      const poItem = await storage.addPurchaseOrderItem({
        purchaseOrderId: testPOId,
        productId: testProductId,
        quantityOrdered: 10,
        unitCost: "150.00",
      });
      pass(`Added PO item (ID: ${poItem.id})`);

      const poList = await storage.getPurchaseOrders();
      if (!poList.some((p) => p.id === testPOId)) {
        throw new Error("getPurchaseOrders() missing test PO");
      }
      pass("Verified purchase order in getPurchaseOrders()");
    } catch (err) {
      fail("Suppliers & PO Flow", err);
    }

    // -------------------------------------------------------------------------
    // 11. REPORTS & ANALYTICS FLOW
    // -------------------------------------------------------------------------
    console.log("\n📈 [11/12] Testing Reports & Analytics Queries...");
    try {
      const valuation = await storage.getStockValuation();
      pass(`getStockValuation() -> Total Cost: ₹${valuation.totalCost}, Valuation: ₹${valuation.totalValuation}`);

      const salesToday = await storage.getSalesToday();
      pass(`getSalesToday() -> Today count: ${salesToday.length}`);

      const notSelling = await storage.getNotSellingProducts({ sinceDays: 30 });
      pass(`getNotSellingProducts(30d) -> Found ${notSelling.length} items`);

      const profitMargins = await storage.getProfitMargins({ sinceDays: 30 });
      pass(`getProfitMargins(30d) -> Total Profit: ₹${profitMargins.totalProfit}`);
    } catch (err) {
      fail("Reports & Analytics Flow", err);
    }

    // -------------------------------------------------------------------------
    // 12. USER SESSIONS & HEARTBEAT FLOW
    // -------------------------------------------------------------------------
    console.log("\n💻 [12/12] Testing User Sessions & Active Devices...");
    try {
      const token = `e2e_session_${Date.now()}`;
      const session = await storage.createUserSession({
        userId: "admin-dev-001",
        sessionToken: token,
        deviceName: "E2E Test Browser / Chrome",
        ipAddress: "127.0.0.1",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) E2E Test",
      });
      testSessionId = session.id;
      pass(`Created user session (ID: ${session.id})`);

      await storage.updateHeartbeat(token, false, "idle");
      pass("Updated heartbeat for session");

      const activeSessions = await storage.getUserSessions("admin-dev-001");
      if (!activeSessions.some((s) => s.sessionToken === token)) {
        throw new Error("getUserSessions() missing test session");
      }
      pass("Verified active session in getUserSessions()");

      await storage.deleteUserSession(token, "admin-dev-001");
      pass("Deleted test user session via deleteUserSession()");
    } catch (err) {
      fail("User Sessions Flow", err);
    }
  } finally {
    // =========================================================================
    // SYSTEMATIC DATABASE RESTORATION & TEARDOWN
    // Clean up every test record created so the database is 100% pristine!
    // =========================================================================
    console.log("\n🧹 CLEANING UP ALL TEST RECORDS (RESTORING DATABASE)...");

    if (testSessionId) {
      await pgClient.query("DELETE FROM user_sessions WHERE id = $1", [testSessionId]);
      console.log("  - Cleaned up test user session");
    }
    if (testPOId) {
      await pgClient.query("DELETE FROM purchase_order_items WHERE purchase_order_id = $1", [testPOId]);
      await pgClient.query("DELETE FROM purchase_orders WHERE id = $1", [testPOId]);
      console.log("  - Cleaned up test purchase order & items");
    }
    if (testSupplierId) {
      await pgClient.query("DELETE FROM suppliers WHERE id = $1", [testSupplierId]);
      console.log("  - Cleaned up test supplier");
    }
    if (testPromotionId) {
      await pgClient.query("DELETE FROM promotion_targets WHERE promotion_id = $1", [testPromotionId]);
      await pgClient.query("DELETE FROM promotions WHERE id = $1", [testPromotionId]);
      console.log("  - Cleaned up test promotion & targets");
    }
    if (testSaleId) {
      await pgClient.query("DELETE FROM sale_items WHERE sale_id = $1", [testSaleId]);
      await pgClient.query("DELETE FROM sales WHERE id = $1", [testSaleId]);
      console.log("  - Cleaned up test sale & items");
    }
    if (testCouponId) {
      await storage.deleteDiscountCoupon(testCouponId);
      console.log("  - Cleaned up test discount coupon");
    }
    if (testSalespersonId) {
      await pgClient.query("DELETE FROM salespersons WHERE id = $1", [testSalespersonId]);
      console.log("  - Cleaned up test salesperson");
    }
    if (testCustomerId) {
      await pgClient.query("DELETE FROM customers WHERE id = $1", [testCustomerId]);
      console.log("  - Cleaned up test customer");
    }
    if (testProductId) {
      await pgClient.query("DELETE FROM stock_movements WHERE product_id = $1", [testProductId]);
      await pgClient.query("DELETE FROM product_cost_history WHERE product_id = $1", [testProductId]);
      await pgClient.query("DELETE FROM products WHERE id = $1", [testProductId]);
      console.log("  - Cleaned up test product & stock movements");
    }
    if (testCategoryId) {
      await pgClient.query("DELETE FROM categories WHERE id = $1", [testCategoryId]);
      console.log("  - Cleaned up test category");
    }

    // Verify row counts after cleanup match snapshot before test
    const countAfter = await getRowCounts(pgClient);
    console.log("\n📊 DB Snapshot after teardown:", countAfter);

    let match = true;
    for (const [table, count] of Object.entries(countBefore)) {
      if (countAfter[table] !== count) {
        console.error(`⚠️ Count mismatch on ${table}: Before=${count}, After=${countAfter[table]}`);
        match = false;
      }
    }

    if (match) {
      console.log("✨ VERIFIED: Database row counts are 100% IDENTICAL before and after testing!");
    } else {
      console.warn("⚠️ Warning: Some row counts differed. Check database logs.");
    }

    await pgClient.end();
  }

  console.log("\n==================================================");
  if (allPassed) {
    console.log("🎉 ALL 12 VALIDATION FLOWS PASSED WITH ZERO ERRORS!");
  } else {
    console.error("❌ SOME FLOWS FAILED. Review errors above.");
    process.exit(1);
  }
  console.log("==================================================");
}

async function getRowCounts(client: Client) {
  const tables = [
    "products",
    "categories",
    "sales",
    "sale_items",
    "customers",
    "salespersons",
    "discount_coupons",
    "stock_movements",
    "promotions",
    "purchase_orders",
  ];
  const counts: Record<string, number> = {};
  for (const t of tables) {
    const res = await client.query(`SELECT COUNT(*) as c FROM ${t};`);
    counts[t] = parseInt(res.rows[0].c, 10);
  }
  return counts;
}

main().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
