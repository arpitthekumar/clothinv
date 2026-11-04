/**
 * Unified Date & Time Utilities for Indian Standard Time (IST, UTC+5:30)
 */

/**
 * Safely parse any date input (Date object, timestamp number, UTC string, ISO string with/without Z)
 * into a valid Date object without double-offsetting.
 */
export function parseDateSafe(input?: Date | string | number | null): Date {
  if (!input) return new Date();
  if (input instanceof Date) {
    return isNaN(input.getTime()) ? new Date() : input;
  }
  if (typeof input === "number") {
    const d = new Date(input);
    return isNaN(d.getTime()) ? new Date() : d;
  }
  if (typeof input === "string") {
    const str = input.trim();
    if (!str) return new Date();

    // Already ends with Z or has offset like +05:30 or -04:00
    if (str.endsWith("Z") || /[+-]\d{2}(:?\d{2})?$/.test(str)) {
      const d = new Date(str);
      if (!isNaN(d.getTime())) return d;
    }

    // Bare timestamp string like "2026-11-04 09:23:58" or "2026-11-04T09:23:58" from PostgreSQL UTC
    if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(str)) {
      const d = new Date(str.replace(" ", "T") + "Z");
      if (!isNaN(d.getTime())) return d;
    }

    const d = new Date(str);
    return isNaN(d.getTime()) ? new Date() : d;
  }
  return new Date();
}

/**
 * Format date & time in Indian Standard Time (IST).
 * Returns { formattedDate: "04/11/2026", formattedTime: "02:52 PM", formattedTime24: "14:52", date: Date }
 */
export function formatISTDateTime(input?: Date | string | number | null) {
  const d = parseDateSafe(input);

  const formattedDate = d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });

  const formattedTime = d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });

  const formattedTime24 = d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Kolkata",
  });

  return { formattedDate, formattedTime, formattedTime24, date: d };
}

