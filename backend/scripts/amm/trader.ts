import { AccountManager } from "./account-manager";
import type {
  AccountState,
  AMMConfig,
  City,
  Logger,
  TradingStrategy,
} from "./types";
import { randomBetween, randomChoice, sleep } from "./utils/helpers";

export class AMMTrader {
  private readonly config: AMMConfig;
  private readonly strategy: TradingStrategy;
  private readonly accountManager: AccountManager;
  private readonly logger: Logger;

  private accounts: AccountState[] = [];
  private cities: City[] = [];
  private running = false;

  constructor(
    config: AMMConfig,
    strategy: TradingStrategy,
    accountManager: AccountManager,
    logger: Logger
  ) {
    this.config = config;
    this.strategy = strategy;
    this.accountManager = accountManager;
    this.logger = logger;
  }

  async start(): Promise<void> {
    if (this.running) {
      this.logger.warn("AMM is already running");
      return;
    }

    this.running = true;
    this.logger.info("Starting AMM bot...");

    await this.initialize();
    await this.loop();
  }

  async stop(): Promise<void> {
    this.running = false;
    this.logger.info("Stopping AMM bot...");
  }

  private async initialize(): Promise<void> {
    this.accounts = await this.accountManager.initialize();
    await this.loadCities();
  }

  private async loadCities(): Promise<void> {
    const client = this.accounts[0]?.client;
    if (!client) {
      throw new Error("No available clients for loading cities");
    }
    const allCities = await client.getCities();
    this.cities = this.config.cityIds
      ? allCities.filter((c) => this.config.cityIds?.includes(c.id))
      : allCities;

    this.logger.info(`Loaded cities: ${this.cities.length}`);
  }

  private async loop(): Promise<void> {
    while (this.running) {
      try {
        const delay = randomBetween(
          this.config.trading.minTradeInterval,
          this.config.trading.maxTradeInterval
        );
        await sleep(delay);

        const account = randomChoice(this.accounts);
        const refreshed = await this.accountManager.refreshAccount(account);
        this.updateAccount(refreshed);

        if (refreshed.balance < this.config.trading.minBalance) {
          this.logger.warn(
            `Account ${refreshed.id} balance below minimum: ${refreshed.balance}`
          );
          continue;
        }

        await this.strategy.executeTrade(
          this.cities,
          refreshed,
          refreshed.client
        );
      } catch (error) {
        this.logger.error("Error in trading loop", error);
        await sleep(5000);
      }
    }
  }

  private updateAccount(next: AccountState): void {
    const idx = this.accounts.findIndex((a) => a.id === next.id);
    if (idx >= 0) {
      this.accounts[idx] = next;
    } else {
      this.accounts.push(next);
    }
  }
}
