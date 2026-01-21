import type { 
  City, 
  Position, 
  Logger, 
  OpenPositionRequest, 
  OpenPositionResponse, 
  ClosePositionResponse,
  AMMApiClientInterface 
} from "../types";
import { list as listCities } from "../../../city/list";
import { getBalanceInternal } from "../../../user/balance_internal";
import { getPositionsInternal } from "../../../trading/get_positions_internal";
import { openPositionInternal } from "../../../trading/open_position_internal";
import { closePositionInternal } from "../../../trading/close_position_internal";

/**
 * Internal API client that uses user ID from database directly
 * This bypasses HTTP and authentication, calling Encore services internally
 */
export class InternalAMMApiClient implements AMMApiClientInterface {
  private readonly userId: string;
  private readonly logger: Logger;

  constructor(userId: string, logger: Logger) {
    this.userId = userId;
    this.logger = logger;
  }

  async getCities(): Promise<City[]> {
    // City list doesn't require auth, but we'll call it directly
    const response = await listCities();
    return response.cities.map((c) => ({
      id: c.id,
      name: c.name,
      indexPriceUsd: c.indexPriceUsd,
      marketPriceUsd: c.marketPriceUsd,
      fundingRate: c.fundingRate,
    }));
  }

  async getBalance(): Promise<number> {
    return await getBalanceInternal(this.userId);
  }

  async getPositions(): Promise<Position[]> {
    return await getPositionsInternal(this.userId);
  }

  async openPosition(req: OpenPositionRequest): Promise<OpenPositionResponse> {
    return await openPositionInternal(this.userId, req);
  }

  async closePosition(positionId: number): Promise<ClosePositionResponse> {
    return await closePositionInternal(this.userId, positionId);
  }
}
