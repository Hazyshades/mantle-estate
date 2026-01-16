import type { 
  City, 
  Position, 
  Logger, 
  OpenPositionRequest, 
  OpenPositionResponse, 
  ClosePositionResponse,
  AMMApiClientInterface 
} from "../types";

interface RequestOptions extends RequestInit {
  path: string;
}

export class AMMApiClient implements AMMApiClientInterface {
  private readonly baseUrl: string;
  private readonly token: string;
  private readonly logger: Logger;

  constructor(baseUrl: string, token: string, logger: Logger) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.token = token;
    this.logger = logger;
  }

  async getCities(): Promise<City[]> {
    const response = await this.request<{ cities: City[] }>({
      path: "/cities",
      method: "GET",
    });
    return response.cities;
  }

  async getBalance(): Promise<number> {
    const response = await this.request<{ balance: number }>({
      path: "/user/balance",
      method: "GET",
    });
    return response.balance;
  }

  async getPositions(): Promise<Position[]> {
    const response = await this.request<{ positions: Position[] }>({
      path: "/trading/positions",
      method: "GET",
    });
    return response.positions;
  }

  async openPosition(
    req: OpenPositionRequest
  ): Promise<OpenPositionResponse> {
    return await this.request<OpenPositionResponse>({
      path: "/trading/open",
      method: "POST",
      body: JSON.stringify(req),
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  async closePosition(positionId: number): Promise<ClosePositionResponse> {
    return await this.request<ClosePositionResponse>({
      path: `/trading/close/${positionId}`,
      method: "POST",
    });
  }

  private async request<T>(options: RequestOptions): Promise<T> {
    const url = `${this.baseUrl}${options.path}`;
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...(options.headers ?? {}),
          Authorization: `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        const text = await response.text();
        this.logger.error("API error", response.status, text);
        throw new Error(`API ${response.status}: ${text}`);
      }

      return (await response.json()) as T;
    } catch (error) {
      this.logger.error("Request failed", url, error);
      throw error;
    }
  }
}
