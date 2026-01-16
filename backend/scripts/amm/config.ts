import { config as loadEnv } from "dotenv";
import type { AMMConfig, LogLevel } from "./types";

loadEnv();

function parseNumber(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseLogLevel(value: string | undefined): LogLevel {
  if (value === "debug" || value === "info" || value === "warn" || value === "error") {
    return value;
  }
  return "info";
}

const cityIds =
  process.env.AMM_CITY_IDS?.split(",")
    .map((v) => Number(v.trim()))
    .filter((v) => Number.isFinite(v)) ?? undefined;

const config: AMMConfig = {
  apiBaseUrl: process.env.ENCORE_API_URL ?? "http://localhost:4000",
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
    minTradeSize: parseNumber(process.env.AMM_MIN_TRADE_SIZE, 5000),
    maxTradeSize: parseNumber(process.env.AMM_MAX_TRADE_SIZE, 9000),
    minBalance: parseNumber(process.env.AMM_MIN_BALANCE, 20),
    minTradeInterval: parseNumber(process.env.AMM_MIN_TRADE_INTERVAL_MS, 17_000),
    maxTradeInterval: parseNumber(process.env.AMM_MAX_TRADE_INTERVAL_MS, 150_000),
    minHoldTime: parseNumber(process.env.AMM_MIN_HOLD_TIME_MS, 5_000),
    maxHoldTime: parseNumber(process.env.AMM_MAX_HOLD_TIME_MS, 60_000),
    closeProbability: parseNumber(process.env.AMM_CLOSE_PROBABILITY, 0.35),
    maxOpenPositions: parseNumber(process.env.AMM_MAX_OPEN_POSITIONS, 5),
    leverage: [1],
  },
  strategy:
    (process.env.AMM_STRATEGY as AMMConfig["strategy"]) ?? "random",
  cityIds,
  logging: {
    level: parseLogLevel(process.env.AMM_LOG_LEVEL),
  },
};

if (!config.accounts.length) {
  throw new Error(
    "At least one user ID must be specified (AMM_ACCOUNT_1_TOKEN / AMM_ACCOUNT_2_TOKEN). " +
    "These should be user IDs from the database users table (e.g., user_38CwFghMGHM1wv0VHDTfAhXLssz)"
  );
}

export default config;
