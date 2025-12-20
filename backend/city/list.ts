import { api } from "encore.dev/api";
import db from "../db";

export interface City {
  id: number;
  name: string;
  country: string;
  currentPriceUsd: number; // Keep for backward compatibility (equals indexPriceUsd)
  indexPriceUsd: number; // NEW: trading price
  marketPriceUsd: number; // NEW: price from Zillow CSV
  fundingRate: number; // NEW: funding rate
  averagePropertySizeSqft: number | null;
  lastUpdated: Date;
}

interface ListCitiesResponse {
  cities: City[];
}

// List all cities with current prices
export const list = api<void, ListCitiesResponse>(
  { expose: true, method: "GET", path: "/cities" },
  async () => {
    const rows = await db.queryAll<{
      id: number;
      name: string;
      country: string;
      index_price_usd: number;
      market_price_usd: number;
      funding_rate: number;
      average_property_size_sqft: number | null;
      last_updated: Date;
    }>`
      SELECT 
        id, name, country, 
        index_price_usd, market_price_usd, funding_rate,
        average_property_size_sqft, last_updated
      FROM cities
      ORDER BY name
    `;

    const cities = rows.map((row) => ({
      id: row.id,
      name: row.name,
      country: row.country,
      currentPriceUsd: row.index_price_usd, // For backward compatibility
      indexPriceUsd: row.index_price_usd,
      marketPriceUsd: row.market_price_usd,
      fundingRate: row.funding_rate,
      averagePropertySizeSqft: row.average_property_size_sqft,
      lastUpdated: row.last_updated,
    }));

    return { cities };
  }
);
