import { NextRequest, NextResponse } from "next/server";
import { storage } from "@server/storage";
import { requireAuth } from "../_lib/session";
import { insertCustomerSchema } from "@shared/schema";

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const search = url.searchParams.get("q") || undefined;
  const includeDeleted = url.searchParams.get("includeDeleted") === "true";

  try {
    const customers = await storage.getCustomers(search, includeDeleted);
    return NextResponse.json(customers);
  } catch (error: any) {
    console.error("GET /api/customers error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch customers" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();

    // Validate request body
    const validated = insertCustomerSchema.parse({
      name: body.name,
      phone: body.phone,
      email: body.email || undefined,
    });

    // Check for existing phone number duplicate
    const existing = await storage.getCustomerByPhone(validated.phone);
    if (existing) {
      return NextResponse.json(
        { error: "A customer with this phone number already exists." },
        { status: 400 }
      );
    }

    const customer = await storage.createCustomer(validated);
    return NextResponse.json(customer, { status: 201 });
  } catch (error: any) {
    if (error?.name === "ZodError" || error?.errors) {
      const firstErr = error.errors?.[0]?.message || "Invalid customer input data";
      return NextResponse.json({ error: firstErr }, { status: 400 });
    }
    console.error("POST /api/customers error:", error);
    return NextResponse.json({ error: error.message || "Failed to create customer" }, { status: 400 });
  }
}
