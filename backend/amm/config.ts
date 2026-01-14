import type { AMMConfig } from "../scripts/amm/types";

function parseNumber(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseLogLevel(
  value: string | undefined
): "debug" | "info" | "warn" | "error" {
  if (value === "debug" || value === "info" || value === "warn" || value === "error") {
    return value;
  }
  return "info";
}

const cityIds =
  process.env.AMM_CITY_IDS?.split(",")
    .map((v) => Number(v.trim()))
    .filter((v) => Number.isFinite(v)) ?? undefined;

// For Encore service, use internal API URL
const apiBaseUrl =
  process.env.ENCORE_API_URL ?? process.env.AMM_API_URL ?? "http://localhost:4000";

const config: AMMConfig = {
  apiBaseUrl,
  accounts: [
    process.env.AMM_ACCOUNT_1_TOKEN
      ? { 
          id: "account-1", 
          userId: process.env.AMM_ACCOUNT_1_TOKEN, // User ID from DB users table
          clerkToken: process.env.AMM_ACCOUNT_1_CLERK_TOKEN, // Optional Clerk token
        }
      : undefined,
    process.env.AMM_ACCOUNT_2_TOKEN
      ? { 
          id: "account-2", 
          userId: process.env.AMM_ACCOUNT_2_TOKEN, // User ID from DB users table
          clerkToken: process.env.AMM_ACCOUNT_2_CLERK_TOKEN, // Optional Clerk token
        }
      : undefined,
  ].filter(Boolean) as AMMConfig["accounts"],
  trading: {
    minTradeSize: parseNumber(process.env.AMM_MIN_TRADE_SIZE, 25),
    maxTradeSize: parseNumber(process.env.AMM_MAX_TRADE_SIZE, 150),
    minBalance: parseNumber(process.env.AMM_MIN_BALANCE, 20),
    minTradeInterval: parseNumber(process.env.AMM_MIN_TRADE_INTERVAL_MS, 7_000),
    maxTradeInterval: parseNumber(process.env.AMM_MAX_TRADE_INTERVAL_MS, 15_000),
    minHoldTime: parseNumber(process.env.AMM_MIN_HOLD_TIME_MS, 5_000),
    maxHoldTime: parseNumber(process.env.AMM_MAX_HOLD_TIME_MS, 60_000),
    closeProbability: parseNumber(process.env.AMM_CLOSE_PROBABILITY, 0.35),
    maxOpenPositions: parseNumber(process.env.AMM_MAX_OPEN_POSITIONS, 5),
    leverage: [1, 2],
  },
  strategy:
    (process.env.AMM_STRATEGY as AMMConfig["strategy"]) ?? "random",
  cityIds,
  logging: {
    level: parseLogLevel(process.env.AMM_LOG_LEVEL),
  },
};

export default config;
