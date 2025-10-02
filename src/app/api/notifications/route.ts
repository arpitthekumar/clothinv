import { NextResponse } from "next/server";
import { storage } from "@server/storage";
import { requireAuth } from "../_lib/session";
import { hasSupabase } from "@server/supabase";

type NotificationItem = {
  id: string;
  title: string;
  description?: string;
  createdAt: string; // ISO string
  type: "low_stock" | "sales_summary" | "system_status" | "error";
  priority: "high" | "medium" | "low";
};

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });

  const notifications: NotificationItem[] = [];
  const now = new Date().toISOString();

  try {
    // System status check
    if (!hasSupabase) {
      notifications.push({
        id: "system_config_error",
        title: "Database Configuration Issue",
        description: "Supabase is not properly configured. Check environment variables.",
        createdAt: now,
        type: "error",
        priority: "high"
      });
      return NextResponse.json(notifications);
    }

    // Try to fetch products for low stock notifications
    try {
      const products = await storage.getProducts();
      const lowStock = products.filter((p) => p.stock <= (p.minStock || 5));
      
      // Add low stock notifications (limit to 5 to avoid spam)
      lowStock.slice(0, 5).forEach((p) => {
        notifications.push({
          id: `low_stock_${p.id}`,
          title: `Low stock: ${p.name}`,
          description: `Only ${p.stock} left (minimum: ${p.minStock || 5})`,
          createdAt: now,
          type: "low_stock",
          priority: p.stock === 0 ? "high" : "medium"
        });
      });

      // System health notification
      if (products.length === 0) {
        notifications.push({
          id: "no_products",
          title: "No Products Found",
          description: "Your inventory is empty. Add some products to get started.",
          createdAt: now,
          type: "system_status",
          priority: "medium"
        });
      }

    } catch (error) {
      console.error("Error fetching products:", error);
      notifications.push({
        id: "products_error",
        title: "Unable to fetch inventory",
        description: "There was an error loading your products. Please check your database connection.",
        createdAt: now,
        type: "error",
        priority: "high"
      });
    }

    // Try to fetch today's sales summary
    try {
      const todaySales = await storage.getSalesToday();
      const totalToday = todaySales.reduce((sum, s) => sum + Number(s.totalAmount), 0);
      
      // Only show sales summary if there are sales today
      if (todaySales.length > 0) {
        notifications.push({
          id: `sales_${new Date().toDateString()}`,
          title: `Today's Performance`,
          description: `${todaySales.length} orders • $${totalToday.toFixed(2)} total`,
          createdAt: now,
          type: "sales_summary",
          priority: "low"
        });
      }

    } catch (error) {
      console.error("Error fetching sales:", error);
      // Don't add error notification for sales - it's less critical
    }

    // If no issues, add a positive status
    if (notifications.length === 0 || notifications.every(n => n.type === "sales_summary")) {
      notifications.unshift({
        id: "system_healthy",
        title: "System Running Smoothly",
        description: "All systems operational. No immediate issues detected.",
        createdAt: now,
        type: "system_status",
        priority: "low"
      });
    }

  } catch (error) {
    console.error("Unexpected error in notifications:", error);
    notifications.push({
      id: "unexpected_error",
      title: "System Error",
      description: "An unexpected error occurred while checking system status.",
      createdAt: now,
      type: "error",
      priority: "high"
    });
  }

  // Sort by priority: high -> medium -> low
  const priorityOrder = { high: 3, medium: 2, low: 1 };
  notifications.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

  return NextResponse.json(notifications);
}



