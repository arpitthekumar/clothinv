export type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function minLevel(): LogLevel {
  const v = process.env.BACKUP_LOG_LEVEL?.toLowerCase();
  if (v === "debug" || v === "info" || v === "warn" || v === "error") return v;
  return "info";
}

function shouldLog(level: LogLevel): boolean {
  return LEVEL_ORDER[level] >= LEVEL_ORDER[minLevel()];
}

function ts(): string {
  return new Date().toISOString();
}

export const backupLogger = {
  debug(msg: string, extra?: Record<string, unknown>) {
    if (!shouldLog("debug")) return;
    if (extra && Object.keys(extra).length > 0) {
      console.debug(`[${ts()}] [backup] [debug] ${msg}`, extra);
    } else {
      console.debug(`[${ts()}] [backup] [debug] ${msg}`);
    }
  },
  info(msg: string, extra?: Record<string, unknown>) {
    if (!shouldLog("info")) return;
    if (extra && Object.keys(extra).length > 0) {
      console.log(`[${ts()}] [backup] [info] ${msg}`, extra);
    } else {
      console.log(`[${ts()}] [backup] [info] ${msg}`);
    }
  },
  warn(msg: string, extra?: Record<string, unknown>) {
    if (!shouldLog("warn")) return;
    if (extra && Object.keys(extra).length > 0) {
      console.warn(`[${ts()}] [backup] [warn] ${msg}`, extra);
    } else {
      console.warn(`[${ts()}] [backup] [warn] ${msg}`);
    }
  },
  error(msg: string, extra?: Record<string, unknown>) {
    if (!shouldLog("error")) return;
    if (extra && Object.keys(extra).length > 0) {
      console.error(`[${ts()}] [backup] [error] ${msg}`, extra);
    } else {
      console.error(`[${ts()}] [backup] [error] ${msg}`);
    }
  },
};
