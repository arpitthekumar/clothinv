export function parseDeviceName(userAgent?: string | null): string {
  if (!userAgent) return "Unknown Device";

  const ua = userAgent.toLowerCase();

  let browser = "Browser";
  if (ua.includes("edg/")) {
    browser = "Microsoft Edge";
  } else if (ua.includes("chrome") || ua.includes("crios")) {
    browser = "Chrome";
  } else if (ua.includes("firefox") || ua.includes("fxios")) {
    browser = "Firefox";
  } else if (ua.includes("safari") && !ua.includes("chrome")) {
    browser = "Safari";
  } else if (ua.includes("opera") || ua.includes("opr/")) {
    browser = "Opera";
  }

  let os = "";
  if (ua.includes("iphone")) {
    os = "on iPhone";
  } else if (ua.includes("ipad")) {
    os = "on iPad";
  } else if (ua.includes("android")) {
    os = "on Android";
  } else if (ua.includes("win")) {
    os = "on Windows";
  } else if (ua.includes("mac")) {
    os = "on macOS";
  } else if (ua.includes("linux")) {
    os = "on Linux";
  }

  return `${browser} ${os}`.trim();
}
