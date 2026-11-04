import { NextRequest, NextResponse } from "next/server";
import { storage } from "@server/storage";
import { requireAuth } from "../_lib/session";
import { insertCategorySchema } from "@shared/schema";
import { mapProductFromDb } from "@/lib/db-column-mapper";

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });
  const categories = await storage.getCategories();
  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });
  if (auth.user.role !== "admin") return NextResponse.json({}, { status: 403 });

  try {
    const data = insertCategorySchema.parse(await req.json());
    const category = await storage.createCategory(data);
    return NextResponse.json(category, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Invalid category data" },
      { status: 400 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });
  if (auth.user.role !== "admin") return NextResponse.json({}, { status: 403 });

  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("id");

    if (!categoryId) {
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 }
      );
    }

    // Check if any active products are using this category
    const productsRaw = await storage.getProducts(false); // Exclude deleted products
    const productsUsingCategory = (productsRaw || []).filter(
      (p: any) => p.categoryId === categoryId || p.category_id === categoryId
    );

    if (productsUsingCategory.length > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete category. ${productsUsingCategory.length} active product(s) are currently assigned to this category. Please reassign or delete them first.`,
          productCount: productsUsingCategory.length,
        },
        { status: 400 }
      );
    }

    // Delete the category (disassociates soft-deleted products)
    await storage.deleteCategory(categoryId);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete category" },
      { status: 400 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });
  if (auth.user.role !== "admin") return NextResponse.json({}, { status: 403 });

  try {
    const body = await req.json();
    const { id, ...rest } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 }
      );
    }

    const data = insertCategorySchema.partial().parse(rest);
    const updatedCategory = await storage.updateCategory(id, data);

    return NextResponse.json(updatedCategory, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update category" },
      { status: 400 }
    );
  }
}
