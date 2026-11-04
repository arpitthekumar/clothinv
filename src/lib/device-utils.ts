import { UserSession } from "@shared/schema";

export const SUPPORT_PHONE_NUMBER = "6398217416";

export function maskIpAddress(ip?: string | null): string {
  if (!ip || ip === "127.0.0.1" || ip === "::1" || ip === "localhost") {
    return "127.***.***.1";
  }

  const parts = ip.split(".");
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.***.***`;
  }

  // IPv6 or unformatted
  if (ip.length > 8) {
    return `${ip.substring(0, 6)}...***`;
  }

  return ip;
}

export type ComputedDeviceStatus = {
  status: "BUSY" | "ONLINE" | "IDLE" | "OFFLINE" | "REVOKED";
  statusLabel: string;
  isBusy: boolean;
  isReplaceable: boolean;
  idleMinutes: number;
  currentOperation: string | null;
};

export function computeDeviceStatusInfo(
  session: UserSession,
  inactiveThresholdMinutes = 15
): ComputedDeviceStatus {
  if (session.revokedAt) {
    return {
      status: "REVOKED",
      statusLabel: "Revoked Session",
      isBusy: false,
      isReplaceable: false,
      idleMinutes: 999,
      currentOperation: null,
    };
  }

  const now = Date.now();
  const lastActive = session.lastActiveAt
    ? new Date(session.lastActiveAt).getTime()
    : session.lastHeartbeatAt
    ? new Date(session.lastHeartbeatAt).getTime()
    : session.createdAt
    ? new Date(session.createdAt).getTime()
    : now;

  const diffMs = Math.max(0, now - lastActive);
  const idleMinutes = Math.floor(diffMs / (1000 * 60));

  // Check if POS status is explicitly BUSY (only valid if active within 15 minutes)
  const isBusy = (session.posStatus === "BUSY" || Boolean(session.currentPosOperation)) && idleMinutes < 15;

  if (isBusy) {
    return {
      status: "BUSY",
      statusLabel: session.currentPosOperation || "POS Operation in Progress",
      isBusy: true,
      isReplaceable: false, // 🔒 NEVER REPLACABLE WHEN BUSY
      idleMinutes,
      currentOperation: session.currentPosOperation || "POS Operation in Progress",
    };
  }

  // If active in last 2 minutes
  if (diffMs <= 2 * 60 * 1000) {
    return {
      status: "ONLINE",
      statusLabel: "Online / Active",
      isBusy: false,
      isReplaceable: false, // Active recently, protect active session
      idleMinutes,
      currentOperation: null,
    };
  }

  // If inactive between 2 and 15 minutes
  if (idleMinutes < inactiveThresholdMinutes) {
    return {
      status: "IDLE",
      statusLabel: `Idle (${idleMinutes}m ago)`,
      isBusy: false,
      isReplaceable: false, // Within 15m grace period
      idleMinutes,
      currentOperation: null,
    };
  }

  // Inactive > 15 minutes & not busy
  return {
    status: "OFFLINE",
    statusLabel: `Inactive for ${idleMinutes} mins`,
    isBusy: false,
    isReplaceable: true, // Genuinely inactive, safe to replace!
    idleMinutes,
    currentOperation: null,
  };
}
