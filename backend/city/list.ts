import { api } from "encore.dev/api";
import db from "../db";

export interface City {
  id: number;
  name: string;
  country: string;
  currentPriceUsd: number;
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
      current_price_usd: number;
      last_updated: Date;
    }>`
      SELECT id, name, country, current_price_usd, last_updated
      FROM cities
      ORDER BY name
    `;

    const cities = rows.map((row) => ({
      id: row.id,
      name: row.name,
      country: row.country,
      currentPriceUsd: row.current_price_usd,
      lastUpdated: row.last_updated,
    }));

    return { cities };
  }
);
