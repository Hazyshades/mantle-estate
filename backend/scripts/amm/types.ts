export type LogLevel = "debug" | "info" | "warn" | "error";

export interface AMMConfig {
  apiBaseUrl: string;
  accounts: AccountConfig[];
  trading: TradingConfig;
  strategy: "random" | "market-maker" | "rebalancer";
  cityIds?: number[];
  logging: {
    level: LogLevel;
    file?: string;
  };
}

export interface AccountConfig {
  id: string;
  userId: string; // User ID from database (e.g., "user_38CwFghMGHM1wv0VHDTfAhXLssz")
  clerkToken?: string; // Optional: Clerk token if using HTTP API
  walletAddress?: string;
}

// Common interface for both HTTP and internal API clients
export interface AMMApiClientInterface {
  getCities(): Promise<City[]>;
  getBalance(): Promise<number>;
  getPositions(): Promise<Position[]>;
  openPosition(req: OpenPositionRequest): Promise<OpenPositionResponse>;
  closePosition(positionId: number): Promise<ClosePositionResponse>;
}

export interface OpenPositionRequest {
  cityId: number;
  positionType: "long" | "short";
  amountUsd: number;
  leverage?: number;
}

export interface OpenPositionResponse {
  positionId: number;
  quantitySqm: number;
  entryPrice: number;
  fee: number;
  newBalance: number;
}

export interface ClosePositionResponse {
  pnl: number;
  closingFee: number;
  newBalance: number;
  exitPrice: number;
}

export interface AccountState {
  id: string;
  client: AMMApiClientInterface;
  balance: number;
  positions: Position[];
}

export interface TradingConfig {
  minTradeSize: number;
  maxTradeSize: number;
  minBalance: number;
  minTradeInterval: number;
  maxTradeInterval: number;
  minHoldTime: number;
  maxHoldTime: number;
  closeProbability: number;
  maxOpenPositions: number;
  leverage: number[];
}

export interface City {
  id: number;
  name: string;
  indexPriceUsd: number;
  marketPriceUsd: number;
  fundingRate: number;
}

export interface Position {
  id: number;
  cityId: number;
  cityName: string;
  positionType: "long" | "short";
  quantitySqm: number;
  entryPrice: number;
  currentPrice: number;
  leverage: number;
  marginRequired: number;
  openedAt: Date | string;
  currentValue: number;
  unrealizedPnl: number;
  estimatedClosingFee: number;
}

export interface TradingStrategy {
  executeTrade(
    cities: City[],
    account: AccountState,
    apiClient: AMMApiClientInterface
  ): Promise<void>;
}

export interface Logger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}
