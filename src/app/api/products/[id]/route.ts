import { NextRequest, NextResponse } from "next/server";
import { storage } from "@server/storage";
import { requireAuth } from "../../_lib/session";
import { insertProductSchema } from "@shared/schema";

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });
  const product = await storage.getProduct(params.id);
  if (!product) return NextResponse.json({}, { status: 404 });
  return NextResponse.json(product);
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });
  if (auth.user.role !== "admin") return NextResponse.json({}, { status: 403 });

  try {
    const data = insertProductSchema.partial().parse(await req.json());
    const product = await storage.updateProduct(params.id, data);
    if (!product) return NextResponse.json({}, { status: 404 });
    return NextResponse.json(product);
  } catch {
    return NextResponse.json({ error: "Invalid product data" }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });
  if (auth.user.role !== "admin") return NextResponse.json({}, { status: 403 });

  const ok = await storage.deleteProduct(params.id);
  if (!ok) return NextResponse.json({}, { status: 404 });
  return NextResponse.json({}, { status: 204 });
}

// export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
//   const params = await context.params;
//   const auth = await requireAuth();
//   if (!auth.ok) return NextResponse.json({}, { status: 401 });
//   if (auth.user.role !== "admin") return NextResponse.json({}, { status: 403 });

//   const { pathname } = new URL(req.url);
//   if (pathname.endsWith('/restore')) {
//     const ok = await storage.restoreProduct(params.id);
//     if (!ok) return NextResponse.json({ error: "Failed to restore product" }, { status: 500 });
//     return NextResponse.json({ message: "Product restored successfully" });
//   }

//   return NextResponse.json({ error: "Invalid endpoint" }, { status: 400 });
// }


