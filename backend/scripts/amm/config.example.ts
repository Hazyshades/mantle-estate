import type { AMMConfig } from "./types";

/**
 * Copy this file to config.ts and fill in real user IDs/parameters.
 * 
 * userId: User ID from database users table (e.g., "user_38CwFghMGHM1wv0VHDTfAhXLssz")
 * clerkToken: Optional Clerk token for HTTP API calls (if not provided, internal API will be used)
 */
const config: AMMConfig = {
  apiBaseUrl: "http://localhost:4000",
  accounts: [
    {
      id: "account-1",
      userId: "user_38CwFghMGHM1wv0VHDTfAhXLssz", // Replace with actual user ID from DB
      clerkToken: "sk_test_...replace", // Optional: Clerk token for HTTP API
    },
    {
      id: "account-2",
      userId: "user_...replace", // Replace with actual user ID from DB
      clerkToken: "sk_test_...replace", // Optional: Clerk token for HTTP API
    },
  ],
  trading: {
    minTradeSize: 7550,
    maxTradeSize: 9200,
    minBalance: 25,
    minTradeInterval: 5_000,
    maxTradeInterval: 20_000,
    minHoldTime: 5_000,
    maxHoldTime: 60_000,
    closeProbability: 0.4,
    maxOpenPositions: 5,
    leverage: [1, 2],
  },
  strategy: "random",
  cityIds: undefined,
  logging: {
    level: "info",
  },
};

export default config;
