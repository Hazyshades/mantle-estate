import { api, APIError } from "encore.dev/api";
import db from "../db";

interface PriceHistoryRequest {
  cityId: number;
  hours?: number;
  days?: number; // Alternative to hours for longer periods
  years?: number; // For getting data for multiple years
}

export interface PricePoint {
  price: number; // Index Price (for backward compatibility)
  indexPrice: number; // NEW
  marketPrice: number; // NEW
  fundingRate: number; // NEW
  timestamp: Date;
}

interface PriceHistoryResponse {
  prices: PricePoint[];
}

// Get price history for a city
export const getPriceHistory = api<PriceHistoryRequest, PriceHistoryResponse>(
  { expose: true, method: "GET", path: "/cities/:cityId/price-history" },
  async ({ cityId, hours, days, years }) => {
    // Verify city exists
    const city = await db.queryRow<{ id: number }>`
      SELECT id FROM cities WHERE id = ${cityId}
    `;

    if (!city) {
      throw APIError.notFound("City not found");
    }

    // Determine period: priority years > days > hours
    let cutoff: Date;
    if (years !== undefined) {
      cutoff = new Date(Date.now() - years * 365 * 24 * 60 * 60 * 1000);
    } else if (days !== undefined) {
      cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    } else if (hours !== undefined) {
      cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    } else {
      // Default 24 hours
      cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    }

    const rows = await db.queryAll<{
      price_usd: number;
      market_price_usd: number | null;
      index_price_usd: number | null;
      timestamp: Date;
    }>`
      SELECT 
        price_usd,
        market_price_usd,
        index_price_usd,
        timestamp
      FROM price_history
      WHERE city_id = ${cityId} AND timestamp >= ${cutoff}
      ORDER BY timestamp ASC
    `;

    // Get current funding rate for city (can be improved by adding to table)
    const currentCity = await db.queryRow<{ funding_rate: number }>`
      SELECT funding_rate FROM cities WHERE id = ${cityId}
    `;
    const defaultFundingRate = currentCity?.funding_rate || 0;

    const prices = rows.map((row) => ({
      price: row.index_price_usd || row.price_usd, // For backward compatibility
      indexPrice: row.index_price_usd || row.price_usd,
      marketPrice: row.market_price_usd || row.price_usd,
      fundingRate: defaultFundingRate, // Can be added to table or calculated
      timestamp: row.timestamp,
    }));

    return { prices };
  }
);
