import { NextRequest, NextResponse } from "next/server";
import { storage } from "@server/storage";
import { requireAuth } from "../../_lib/session";
import { insertUserSchema } from "@shared/schema";
import { isSuperAdminUser } from "@server/super-admin";
import { SUPPORT_PHONE_NUMBER } from "@/lib/device-utils";

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });
  if (auth.user.role !== "admin" && auth.user.role !== "superadmin") return NextResponse.json({}, { status: 403 });

  let users = await storage.getUsers();

  // If requester is NOT Super Admin, hide Super Admin accounts
  const isRequesterSuperAdmin = isSuperAdminUser(auth.user);
  if (!isRequesterSuperAdmin) {
    users = users.filter((u) => !isSuperAdminUser(u));
  }

  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });
  if (auth.user.role !== "admin" && auth.user.role !== "superadmin") return NextResponse.json({}, { status: 403 });

  try {
    const body = await req.json();
    const data = insertUserSchema.parse(body);

    const isRequesterSuperAdmin = isSuperAdminUser(auth.user);

    // Reserved username/name check
    const reservedWords = ["admin", "administrator"];
    const uName = data.username?.trim().toLowerCase();
    const fName = (data.fullName || (data as any).name || "").trim().toLowerCase();

    if (reservedWords.includes(uName) || reservedWords.includes(fName)) {
      return NextResponse.json(
        { error: "The name or username 'admin' is reserved and cannot be used." },
        { status: 400 }
      );
    }

    // Prevent non-super-admin from creating a super-admin account
    if (
      (data.role === "superadmin" || data.username?.trim().toLowerCase() === "admin") &&
      !isRequesterSuperAdmin
    ) {
      return NextResponse.json(
        { error: "Only Super Admin can create Super Admin accounts" },
        { status: 403 }
      );
    }

    // Check role capacity limits
    const storeSettings = await storage.getStoreSettings();
    const maxEmployees = storeSettings.maxAllowedEmployees ?? 3;
    const maxAdmins = storeSettings.maxAllowedAdmins ?? 2;
    const allUsers = await storage.getUsers();

    if (data.role === "employee" && !isRequesterSuperAdmin) {
      const currentEmployees = allUsers.filter((u) => u.role === "employee").length;
      if (currentEmployees >= maxEmployees) {
        return NextResponse.json(
          {
            error: `Employee account limit reached (${currentEmployees}/${maxEmployees} max allowed). Contact Super Admin (${SUPPORT_PHONE_NUMBER}) to increase account capacity.`,
          },
          { status: 400 }
        );
      }
    }

    if (data.role === "admin" && !isRequesterSuperAdmin) {
      const currentAdmins = allUsers.filter(
        (u) => u.role === "admin" && !isSuperAdminUser(u)
      ).length;
      if (currentAdmins >= maxAdmins) {
        return NextResponse.json(
          {
            error: `Admin account limit reached (${currentAdmins}/${maxAdmins} max allowed). Contact Super Admin (${SUPPORT_PHONE_NUMBER}) to increase account capacity.`,
          },
          { status: 400 }
        );
      }
    }

    // Check if username exists
    const existing = await storage.getUserByUsername(data.username);
    if (existing) {
      return NextResponse.json({ error: "Username already exists" }, { status: 400 });
    }

    // Save plain text password
    const user = await storage.createUser({
      ...data,
      password: data.password,
    });

    return NextResponse.json(user, { status: 201 });
  } catch (err) {
    console.error("Error creating user:", err);
    return NextResponse.json({ error: "Invalid user data" }, { status: 400 });
  }
}
