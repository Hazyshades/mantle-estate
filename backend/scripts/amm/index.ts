import config from "./config";
import { AccountManager } from "./account-manager";
import { AMMTrader } from "./trader";
import type { TradingStrategy } from "./types";
import { createLogger } from "./utils/logger";
import { RandomStrategy } from "./strategies/random";
import { MarketMakerStrategy } from "./strategies/market-maker";
import { RebalancerStrategy } from "./strategies/rebalancer";

const logger = createLogger(config.logging.level);

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

async function main(): Promise<void> {
  const strategy = buildStrategy();
  const accountManager = new AccountManager(config, logger);
  const trader = new AMMTrader(config, strategy, accountManager, logger);

  const stop = async () => {
    await trader.stop();
    process.exit(0);
  };

  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);

  await trader.start();
}

main().catch((error) => {
  logger.error("Critical AMM error", error);
  process.exit(1);
});
