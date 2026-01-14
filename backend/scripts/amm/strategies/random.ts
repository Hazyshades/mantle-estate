import type {
  AccountState,
  AMMConfig,
  City,
  Logger,
  TradingStrategy,
} from "../types";
import { randomBetween, randomChoice } from "../utils/helpers";
import type { AMMApiClientInterface } from "../types";

export class RandomStrategy implements TradingStrategy {
  private readonly config: AMMConfig;
  private readonly logger: Logger;

  constructor(config: AMMConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
  }

  async executeTrade(
    cities: City[],
    account: AccountState,
    apiClient: AMMApiClientInterface
  ): Promise<void> {
    const positions = await apiClient.getPositions();

    // If too many open positions - close a random one
    if (positions.length >= this.config.trading.maxOpenPositions) {
      const position = randomChoice(positions);
      this.logger.info(
        `Closing position ${position.id} for account ${account.id} (open limit)`
      );
      await apiClient.closePosition(position.id);
      return;
    }

    // If city already has a position - close it with 30% probability
    const city = randomChoice(cities);
    const existing = positions.find((p) => p.cityId === city.id);
    if (existing && Math.random() < 0.3) {
      this.logger.info(
        `Closing existing position ${existing.id} for city ${city.name}`
      );
      await apiClient.closePosition(existing.id);
      return;
    }

    // Open new position
    const positionType = randomChoice<"long" | "short">(["long", "short"]);
    const amountUsd = randomBetween(
      this.config.trading.minTradeSize,
      this.config.trading.maxTradeSize
    );
    const leverage = randomChoice(this.config.trading.leverage);

    try {
      const opened = await apiClient.openPosition({
        cityId: city.id,
        positionType,
        amountUsd,
        leverage,
      });
      this.logger.info(
        `Opened ${positionType} position: ${city.name}, ${amountUsd.toFixed(
          2
        )} USD, ${leverage}x`
      );

      if (Math.random() < this.config.trading.closeProbability) {
        const delay = randomBetween(
          this.config.trading.minHoldTime,
          this.config.trading.maxHoldTime
        );
        setTimeout(() => {
          apiClient
            .closePosition(opened.positionId)
            .then(() =>
              this.logger.info(
                `Closed position ${opened.positionId} via delayed timer`
              )
            )
            .catch((err) =>
              this.logger.error(
                `Failed to close position ${opened.positionId}`,
                err
              )
            );
        }, delay);
      }
    } catch (error) {
      this.logger.error("Failed to open position", error);
    }
  }
}
