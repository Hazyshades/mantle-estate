import type {
  AccountState,
  AMMConfig,
  City,
  Logger,
  TradingStrategy,
} from "../types";
import type { AMMApiClientInterface } from "../types";

/**
 * Stub for rebalancing strategy. Add trading rules before using.
 */
export class RebalancerStrategy implements TradingStrategy {
  private readonly logger: Logger;

  constructor(config: AMMConfig, logger: Logger) {
    this.logger = logger;
    this.logger.warn(
      "RebalancerStrategy is not implemented. Use random or implement the logic."
    );
  }

  async executeTrade(
    _cities: City[],
    _account: AccountState,
    _apiClient: AMMApiClientInterface
  ): Promise<void> {
    throw new Error("RebalancerStrategy is not implemented");
  }
}
