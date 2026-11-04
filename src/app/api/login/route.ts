import { NextRequest, NextResponse } from "next/server";
import { getSession } from "../_lib/session";
import { storage } from "@server/storage";
import { User, UserSession } from "@shared/schema";
import { parseDeviceName } from "@/lib/device-parser";
import { computeDeviceStatusInfo, maskIpAddress, SUPPORT_PHONE_NUMBER } from "@/lib/device-utils";
import { isSuperAdminUser } from "@server/super-admin";
import { validateSubscriptionAccess } from "@server/subscription";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { username, password, disconnectSessionId } = body;

  if (!username || !password) {
    return NextResponse.json({ message: "Username and password are required" }, { status: 400 });
  }

  let user: User | undefined;

  // Local dev bypass check
  if (process.env.NODE_ENV === "development" && username === "admin" && password === "admin123") {
    user = {
      id: "admin-dev-001",
      username: "admin",
      password: "admin123",
      role: "admin",
      fullName: "Administrator (Dev)",
      createdAt: new Date(),
    } as User;
  } else {
    // Fetch user from DB
    user = await storage.getUserByUsername(username);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized - User not found" }, { status: 401 });
    }

    if (user.password !== password) {
      return NextResponse.json({ message: "Unauthorized - Wrong password" }, { status: 401 });
    }
  }

  // Extract device info
  const userAgent = req.headers.get("user-agent") || "";
  const ipAddress =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1";
  const deviceName = parseDeviceName(userAgent);
  const isSuperAdmin = isSuperAdminUser(user);

  // Check subscription status: block login for regular admins & employees if expired
  if (!isSuperAdmin) {
    const subCheck = await validateSubscriptionAccess(user);
    if (!subCheck.allowed) {
      return NextResponse.json(
        {
          message: subCheck.message || "Account subscription has expired. In-app login is suspended. Please contact sales to renew.",
          supportPhone: SUPPORT_PHONE_NUMBER,
          subscriptionExpired: true,
        },
        { status: 403 }
      );
    }
  }

  // Fetch active sessions for this user
  let activeSessions = await storage.getUserSessions(user.id);
  // Filter non-revoked sessions
  activeSessions = activeSessions.filter((s) => !s.revokedAt);

  // Auto-prune stale / duplicate sessions for THIS user account:
  // 1. Auto-revoke sessions idle for > 60 minutes
  // 2. Auto-revoke non-busy sessions from the exact same device name or IP
  for (const s of activeSessions) {
    const statusInfo = computeDeviceStatusInfo(s);
    if (statusInfo.idleMinutes >= 60) {
      await storage.revokeSession(s.id, "Auto-pruned stale session (>60m idle)", user.id);
    } else if (
      !statusInfo.isBusy &&
      (s.deviceName === deviceName || (s.ipAddress && s.ipAddress === ipAddress && s.ipAddress !== "127.0.0.1"))
    ) {
      await storage.revokeSession(s.id, "Replaced duplicate session from same device", user.id);
    }
  }

  // Refresh active sessions for THIS user after auto-pruning
  activeSessions = (await storage.getUserSessions(user.id)).filter((s) => !s.revokedAt);

  // If user requested to disconnect an old session
  if (disconnectSessionId) {
    const targetSession = activeSessions.find((s) => s.id === disconnectSessionId || s.sessionToken === disconnectSessionId);

    if (targetSession) {
      const statusInfo = computeDeviceStatusInfo(targetSession);

      // 1. Never revoke a BUSY POS device
      if (statusInfo.isBusy) {
        return NextResponse.json(
          {
            message: `Cannot log out device: A POS operation ('${statusInfo.currentOperation || "POS Operation"}') is currently active on ${targetSession.deviceName}. Transaction integrity is protected.`,
            supportPhone: SUPPORT_PHONE_NUMBER,
          },
          { status: 400 }
        );
      }

      // 2. Protect active online devices (<15m idle) unless Super Admin or same device
      if (!statusInfo.isReplaceable && !isSuperAdmin && targetSession.deviceName !== deviceName) {
        return NextResponse.json(
          {
            message: `Device '${targetSession.deviceName}' is currently active (${statusInfo.statusLabel}). To prevent interrupting active POS work, only inactive devices (>15 mins idle) can be replaced during sign-in. Contact Super Admin (${SUPPORT_PHONE_NUMBER}) for assistance.`,
            supportPhone: SUPPORT_PHONE_NUMBER,
          },
          { status: 400 }
        );
      }

      // Revoke the replaceable or super-admin selected session
      await storage.revokeSession(targetSession.id, "Replaced during new device sign in", user.id);
      activeSessions = (await storage.getUserSessions(user.id)).filter((s) => !s.revokedAt);
    }
  }

  // Enforce Max 2 Devices limit
  if (activeSessions.length >= 2) {
    const enrichedDevices = activeSessions.map((s) => {
      const statusInfo = computeDeviceStatusInfo(s);
      const isReplaceable = (statusInfo.isReplaceable || isSuperAdmin || s.deviceName === deviceName) && !statusInfo.isBusy;
      return {
        ...s,
        statusInfo: {
          ...statusInfo,
          isReplaceable,
        },
        maskedIp: maskIpAddress(s.ipAddress),
      };
    });

    const hasReplaceable = enrichedDevices.some((d) => d.statusInfo.isReplaceable);

    return NextResponse.json(
      {
        deviceLimitReached: true,
        message: `${activeSessions.length} devices are currently in use on this account.`,
        supportPhone: SUPPORT_PHONE_NUMBER,
        hasReplaceableDevice: hasReplaceable,
        activeDevices: enrichedDevices,
      },
      { status: 403 }
    );
  }

  // Create new session token & store device session atomically
  const sessionToken = crypto.randomUUID();
  await storage.createUserSession({
    userId: user.id,
    sessionToken,
    deviceName,
    ipAddress,
    userAgent,
  });

  // Save session cookie
  const session = await getSession();
  session.user = user;
  session.sessionToken = sessionToken;
  await session.save();

  return NextResponse.json(user, { status: 200 });
}
