import { storage } from "@server/storage";
import { DEFAULT_STORE_SETTINGS } from "@/types/store-settings";
import { isSuperAdminUser } from "./super-admin";
import { User } from "@shared/schema";
import { SUPPORT_PHONE_NUMBER } from "@/lib/device-utils";

export async function isSubscriptionExpired(): Promise<{ isExpired: boolean; expiryDate: string }> {
  try {
    const settings = await storage.getStoreSettings();
    const expiryDateStr = settings.subscriptionExpiryDate || DEFAULT_STORE_SETTINGS.subscriptionExpiryDate!;
    if (!expiryDateStr) {
      return { isExpired: false, expiryDate: "" };
    }
    const expiryTime = new Date(expiryDateStr).getTime();
    if (isNaN(expiryTime)) {
      // Fail closed if date string is corrupted
      return { isExpired: true, expiryDate: expiryDateStr };
    }
    const isExpired = Date.now() >= expiryTime;
    return { isExpired, expiryDate: expiryDateStr };
  } catch (err) {
    console.error("Subscription validation storage error:", err);
    // FAIL CLOSED SECURITY: If storage/database fails to check subscription for protected ops, assume expired to protect transaction integrity
    return { isExpired: true, expiryDate: DEFAULT_STORE_SETTINGS.subscriptionExpiryDate! };
  }
}

export async function validateSubscriptionAccess(user?: User | null): Promise<{
  allowed: boolean;
  isExpired: boolean;
  message?: string;
  expiryDate?: string;
}> {
  // Super Admin account (e.g. username 'admin' or role 'superadmin') is exempt to allow login & subscription renewal
  if (isSuperAdminUser(user)) {
    return { allowed: true, isExpired: false };
  }

  const { isExpired, expiryDate } = await isSubscriptionExpired();
  if (isExpired) {
    const formattedDate = expiryDate
      ? new Date(expiryDate).toLocaleDateString("en-IN", { dateStyle: "long" })
      : "recently";
    return {
      allowed: false,
      isExpired: true,
      expiryDate,
      message: `Account subscription expired on ${formattedDate}. Access to POS, Sales creation, Inventory, and backend operations is suspended for Admin and Employee accounts. Please contact your account manager (+91 ${SUPPORT_PHONE_NUMBER}) to renew.`,
    };
  }

  return { allowed: true, isExpired: false, expiryDate };
}
