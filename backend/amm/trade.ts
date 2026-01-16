import { api } from "encore.dev/api";
import { CronJob } from "encore.dev/cron";
import config from "./config";
import { AccountManager } from "../scripts/amm/account-manager";
import type { TradingStrategy, City } from "../scripts/amm/types";
import { createLogger } from "../scripts/amm/utils/logger";
import { RandomStrategy } from "../scripts/amm/strategies/random";
import { MarketMakerStrategy } from "../scripts/amm/strategies/market-maker";
import { RebalancerStrategy } from "../scripts/amm/strategies/rebalancer";
import { randomChoice } from "../scripts/amm/utils/helpers";

const logger = createLogger(config.logging.level);

// Global state for caching accounts and cities between runs
// Note: In Encore Cloud, each cron job may run in a separate container,
// so cache may not persist between runs. This is fine - initialization is fast.
let cachedAccounts: Awaited<ReturnType<AccountManager["initialize"]>> | null = null;
let cachedCities: City[] | null = null;
let accountManager: AccountManager | null = null;

function buildStrategy(): TradingStrategy {
  switch (config.strategy) {
    case "random":
      return new RandomStrategy(config, logger);
    case "market-maker":
      return new MarketMakerStrategy(config, logger);
    case "rebalancer":
      return new RebalancerStrategy(config, logger);
    default:
      return new RandomStrategy(config, logger);
  }
}

async function initializeIfNeeded(): Promise<{
  accounts: Awaited<ReturnType<AccountManager["initialize"]>>;
  cities: City[];
}> {
  // Create account manager if needed
  if (!accountManager) {
    accountManager = new AccountManager(config, logger);
  }

  // Initialize accounts if needed (or if cache is empty)
  if (!cachedAccounts || cachedAccounts.length === 0) {
    try {
      logger.info("Initializing AMM accounts...");
      cachedAccounts = await accountManager.initialize();
    } catch (error) {
      logger.error("Error initializing accounts", error);
      // Clear cache on error to retry next time
      cachedAccounts = null;
      throw error;
    }
  }

  // Load cities if needed
  if (!cachedCities || cachedCities.length === 0) {
    try {
      logger.info("Loading cities list...");
      const client = cachedAccounts[0]?.client;
      if (!client) {
        throw new Error("No available clients for loading cities");
      }
      const allCities = await client.getCities();
      cachedCities = config.cityIds
        ? allCities.filter((c) => config.cityIds?.includes(c.id))
        : allCities;
      logger.info(`Loaded cities: ${cachedCities.length}`);
    } catch (error) {
      logger.error("Error loading cities", error);
      // Clear cache on error
      cachedCities = null;
      throw error;
    }
  }

  return {
    accounts: cachedAccounts,
    cities: cachedCities,
  };
}

interface TradeResponse {
  success: boolean;
  message: string;
  accountId?: string;
  action?: string;
}

// Endpoint for cron job - executes one trading iteration
export const executeTrade = api(
  { expose: true, method: "POST", path: "/amm/trade" },
  async (): Promise<TradeResponse> => {
    try {
      // Check configuration
      if (!config.accounts.length) {
        return {
          success: false,
          message: "AMM accounts not configured (need AMM_ACCOUNT_1_TOKEN or AMM_ACCOUNT_2_TOKEN)",
        };
      }

      // Initialize if needed
      const { accounts, cities } = await initializeIfNeeded();

      logger.info(`Available accounts: ${accounts.length}`, {
        accountIds: accounts.map(a => a.id),
      });

      if (cities.length === 0) {
        return {
          success: false,
          message: "No available cities for trading",
        };
      }

      if (accounts.length === 0) {
        return {
          success: false,
          message: "No available accounts for trading",
        };
      }

      // Select random account
      const account = randomChoice(accounts);
      logger.info(`Selected account: ${account.id} from ${accounts.length} available accounts`);
      
      // Refresh account state
      if (!accountManager) {
        accountManager = new AccountManager(config, logger);
      }
      const refreshed = await accountManager.refreshAccount(account);

      // Check balance
      if (refreshed.balance < config.trading.minBalance) {
        logger.warn(
          `Account ${refreshed.id} balance below minimum: ${refreshed.balance}`
        );
        return {
          success: false,
          message: `Account ${refreshed.id} balance below minimum: ${refreshed.balance}`,
          accountId: refreshed.id,
        };
      }

      // Execute trading
      const strategy = buildStrategy();
      await strategy.executeTrade(cities, refreshed, refreshed.client);

      // Update cache
      const updatedAccount = await accountManager.refreshAccount(refreshed);
      const accountIndex = accounts.findIndex((a) => a.id === updatedAccount.id);
      if (accountIndex >= 0) {
        accounts[accountIndex] = updatedAccount;
      }

      return {
        success: true,
        message: `Trading executed for account ${refreshed.id}`,
        accountId: refreshed.id,
        action: "trade_executed",
      };
    } catch (error) {
      logger.error("Error executing trade", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
);

// Cron job
const ammCronJob = new CronJob("amm-trade", {
  title: "AMM Trading Bot",
  schedule: "*/30 * * * *", // Every 30 minutes // Examples: "*/1 * * * *" (every minute), "*/5 * * * *" (every 5 minutes)
  endpoint: executeTrade,
});
