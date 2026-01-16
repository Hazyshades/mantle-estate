import type { AccountConfig, AccountState, AMMConfig, Logger } from "./types";
import { AMMApiClient } from "./utils/api-client";
import { InternalAMMApiClient } from "./utils/internal-api-client";

export class AccountManager {
  private readonly config: AMMConfig;
  private readonly logger: Logger;

  constructor(config: AMMConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
  }

  async initialize(): Promise<AccountState[]> {
    const accounts: AccountState[] = [];

    this.logger.info(`Initializing ${this.config.accounts.length} AMM accounts...`);

    for (const account of this.config.accounts) {
      if (!account.userId) {
        this.logger.warn(`Skipping account ${account.id}: no user ID`);
        continue;
      }

      try {
        // Use internal API client (no Clerk token needed) or HTTP API client if token is provided
        const client = account.clerkToken
          ? new AMMApiClient(this.config.apiBaseUrl, account.clerkToken, this.logger)
          : new InternalAMMApiClient(account.userId, this.logger);

        const balance = await client.getBalance();
        const positions = await client.getPositions();

        accounts.push({
          id: account.id,
          client,
          balance,
          positions,
        });

        this.logger.info(
          `Account ${account.id} (user: ${account.userId}) initialized: balance ${balance}, positions ${positions.length}`
        );
      } catch (error) {
        this.logger.error(
          `Failed to initialize account ${account.id} (user: ${account.userId}):`,
          error
        );
        // Continue with other accounts instead of failing completely
        // This allows AMM to work even if one account has issues
      }
    }

    if (!accounts.length) {
      throw new Error("No accounts configured for AMM or all accounts failed to initialize");
    }

    this.logger.info(`Successfully initialized ${accounts.length} out of ${this.config.accounts.length} accounts`);

    return accounts;
  }

  async refreshAccount(account: AccountState): Promise<AccountState> {
    const balance = await account.client.getBalance();
    const positions = await account.client.getPositions();

    return {
      ...account,
      balance,
      positions,
    };
  }
}
