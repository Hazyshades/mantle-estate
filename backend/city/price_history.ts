import { api, APIError } from "encore.dev/api";
import db from "../db";

interface PriceHistoryRequest {
  cityId: number;
  hours?: number;
  days?: number; // Alternative to hours for longer periods
  years?: number; // For getting data for multiple years
}

export interface PricePoint {
  price: number;
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
      timestamp: Date;
    }>`
      SELECT price_usd, timestamp
      FROM price_history
      WHERE city_id = ${cityId} AND timestamp >= ${cutoff}
      ORDER BY timestamp ASC
    `;

    const prices = rows.map((row) => ({
      price: row.price_usd,
      timestamp: row.timestamp,
    }));

    return { prices };
  }
);
