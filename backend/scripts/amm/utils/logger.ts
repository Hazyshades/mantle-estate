import type { LogLevel, Logger } from "../types";

const LEVEL_WEIGHTS: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function shouldLog(current: LogLevel, target: LogLevel): boolean {
  return LEVEL_WEIGHTS[target] >= LEVEL_WEIGHTS[current];
}

function formatPrefix(level: LogLevel): string {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level.toUpperCase()}]`;
}

export function createLogger(level: LogLevel): Logger {
  const current = level;

  return {
    debug: (...args: unknown[]) => {
      if (shouldLog(current, "debug")) {
        console.debug(formatPrefix("debug"), ...args);
      }
    },
    info: (...args: unknown[]) => {
      if (shouldLog(current, "info")) {
        console.info(formatPrefix("info"), ...args);
      }
    },
    warn: (...args: unknown[]) => {
      if (shouldLog(current, "warn")) {
        console.warn(formatPrefix("warn"), ...args);
      }
    },
    error: (...args: unknown[]) => {
      if (shouldLog(current, "error")) {
        console.error(formatPrefix("error"), ...args);
      }
    },
  };
}
