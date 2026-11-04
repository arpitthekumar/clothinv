import { NextRequest, NextResponse } from "next/server";
import { getSession } from "../_lib/session";
import { isSuperAdminUser } from "@/server/super-admin";
import { storage } from "@/server/storage";
import { DEFAULT_STORE_SETTINGS, SubscriptionPaymentRecord } from "@/types/store-settings";
import { SUPPORT_PHONE_NUMBER } from "@/lib/device-utils";

const SALES_CONTACT_PHONE = `+91 ${SUPPORT_PHONE_NUMBER}`;

export async function GET() {
  const session = await getSession();
  const user = session.user || null;
  const isSuper = isSuperAdminUser(user);

  try {
    const settings = await storage.getStoreSettings();
    const expiryDateStr = settings.subscriptionExpiryDate || DEFAULT_STORE_SETTINGS.subscriptionExpiryDate!;
    const expiryTime = new Date(expiryDateStr).getTime();
    const nowTime = Date.now();

    const diffMs = expiryTime - nowTime;
    const realDaysRemaining = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    const isExpired = realDaysRemaining <= 0;
    const isWarning = realDaysRemaining <= 15 && realDaysRemaining > 0;
    const status = isExpired ? "expired" : isWarning ? "warning" : "active";

    const subscriptionRate6Months = settings.subscriptionRate6Months ?? 2500;
    const lastPaymentAmount = settings.lastPaymentAmount ?? 2500;
    const lastPaymentDate = settings.lastPaymentDate || new Date().toISOString();
    const lastPaymentMonths = settings.lastPaymentMonths ?? 6;
    const subscriptionHistory = settings.subscriptionHistory || [];
    const dueAmount = isExpired ? subscriptionRate6Months : 0;

    return NextResponse.json({
      isSuperAdmin: isSuper,
      status: isSuper ? "active" : status,
      expiryDate: expiryDateStr,
      daysRemaining: realDaysRemaining, // Can go negative when expired! (e.g. -4)
      isWarning: isSuper ? false : isWarning,
      isExpired: isSuper ? false : isExpired,
      subscriptionRate6Months,
      lastPaymentAmount,
      lastPaymentDate,
      lastPaymentMonths,
      dueAmount,
      subscriptionHistory,
      contactPhone: SALES_CONTACT_PHONE,
    });
  } catch (error: any) {
    return NextResponse.json({
      isSuperAdmin: isSuper,
      status: "active",
      expiryDate: DEFAULT_STORE_SETTINGS.subscriptionExpiryDate,
      daysRemaining: 180,
      isWarning: false,
      isExpired: false,
      subscriptionRate6Months: 2500,
      lastPaymentAmount: 2500,
      lastPaymentDate: new Date().toISOString(),
      lastPaymentMonths: 6,
      dueAmount: 0,
      subscriptionHistory: [],
      contactPhone: SALES_CONTACT_PHONE,
    });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  const user = session.user || null;

  if (!isSuperAdminUser(user)) {
    return NextResponse.json(
      { error: "Forbidden: Super Admin authority required to manage subscription settings." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const settings = await storage.getStoreSettings();
    const currentRate = body.subscriptionRate6Months !== undefined ? Number(body.subscriptionRate6Months) : (settings.subscriptionRate6Months ?? 2500);

    // Case 1: Updating Subscription Charge Rate ONLY
    if (body.updateRateOnly) {
      if (isNaN(currentRate) || currentRate < 0) {
        return NextResponse.json({ error: "Invalid subscription charge rate" }, { status: 400 });
      }

      const updated = await storage.updateStoreSettings({
        subscriptionRate6Months: currentRate,
      });

      return NextResponse.json({
        ok: true,
        message: `Subscription charge updated to ₹${currentRate.toLocaleString("en-IN")} per 6 Months`,
        subscriptionRate6Months: updated.subscriptionRate6Months,
      });
    }

    // Case 2: Subscription Renewal & Payment Recording
    let targetDate: Date;
    let monthsAdded = 6;

    if (body.addMonths && typeof body.addMonths === "number") {
      monthsAdded = body.addMonths;
      const currentExpiry = settings.subscriptionExpiryDate ? new Date(settings.subscriptionExpiryDate) : new Date();
      targetDate = currentExpiry > new Date() ? currentExpiry : new Date();
      targetDate.setMonth(targetDate.getMonth() + monthsAdded);
    } else if (body.expiryDate) {
      targetDate = new Date(body.expiryDate);
      const now = new Date();
      const diffMonths = (targetDate.getFullYear() - now.getFullYear()) * 12 + (targetDate.getMonth() - now.getMonth());
      monthsAdded = Math.max(1, diffMonths);
    } else {
      targetDate = new Date();
      targetDate.setMonth(targetDate.getMonth() + 6);
      monthsAdded = 6;
    }

    if (isNaN(targetDate.getTime())) {
      return NextResponse.json({ error: "Invalid expiry date provided" }, { status: 400 });
    }

    const defaultAmountForMonths = Math.round((currentRate / 6) * monthsAdded);
    const amountPaid = body.amountPaid !== undefined && body.amountPaid !== "" ? Number(body.amountPaid) : defaultAmountForMonths;
    const newExpiryStr = targetDate.toISOString();
    const paymentDateStr = new Date().toISOString();

    const paymentRecord: SubscriptionPaymentRecord = {
      id: `sub_pay_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      date: paymentDateStr,
      monthsAdded,
      amountPaid: isNaN(amountPaid) ? defaultAmountForMonths : amountPaid,
      ratePer6Months: currentRate,
      newExpiryDate: newExpiryStr,
      paymentMethod: body.paymentMethod || "Direct / Cash",
      notes: body.notes || `Subscription extended by +${monthsAdded} month(s)`,
      renewedBy: user?.fullName || user?.username || "Super Admin",
    };

    const existingHistory = settings.subscriptionHistory || [];
    const updatedHistory = [paymentRecord, ...existingHistory];

    await storage.updateStoreSettings({
      subscriptionExpiryDate: newExpiryStr,
      subscriptionRate6Months: currentRate,
      lastPaymentAmount: paymentRecord.amountPaid,
      lastPaymentDate: paymentDateStr,
      lastPaymentMonths: monthsAdded,
      subscriptionHistory: updatedHistory,
    });

    return NextResponse.json({
      ok: true,
      message: `Subscription successfully renewed until ${targetDate.toLocaleDateString("en-IN", { dateStyle: "long" })} (Payment ₹${paymentRecord.amountPaid.toLocaleString("en-IN")} recorded)`,
      expiryDate: newExpiryStr,
      lastPaymentAmount: paymentRecord.amountPaid,
      subscriptionRate6Months: currentRate,
      subscriptionHistory: updatedHistory,
      contactPhone: SALES_CONTACT_PHONE,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update subscription" }, { status: 500 });
  }
}

