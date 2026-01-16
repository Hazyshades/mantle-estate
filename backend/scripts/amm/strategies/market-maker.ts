import type {
  AccountState,
  AMMConfig,
  City,
  Logger,
  TradingStrategy,
} from "../types";
import type { AMMApiClientInterface } from "../types";

/**
 * Stub for advanced market maker strategy.
 * Currently throws an error to explicitly signal incomplete implementation.
 */
export class MarketMakerStrategy implements TradingStrategy {
  private readonly logger: Logger;

  constructor(config: AMMConfig, logger: Logger) {
    this.logger = logger;
    this.logger.warn(
      "MarketMakerStrategy is not implemented. Use random or implement the logic."
    );
  }

  async executeTrade(
    _cities: City[],
    _account: AccountState,
    _apiClient: AMMApiClientInterface
  ): Promise<void> {
    throw new Error("MarketMakerStrategy is not implemented");
  }
}
