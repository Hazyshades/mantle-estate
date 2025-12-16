import { api, APIError } from "encore.dev/api";
import db from "../db";
import type { City } from "./list";

interface GetCityByCodeRequest {
  code: string; // e.g., "NY-NYC"
}

interface GetCityByCodeResponse {
  city: City;
}

// Function to generate city code from name
function generateCityCode(name: string, country: string): string {
  const parts = name.split(",");
  if (parts.length > 1) {
    const state = parts[1].trim();
    const cityName = parts[0].trim();
    const stateCode = state.length === 2 ? state.toUpperCase() : state.substring(0, 3).toUpperCase();
    const cityCode = cityName.substring(0, 3).toUpperCase();
    return `${stateCode}-${cityCode}`;
  }
  // If no state, use first 2 characters of country and first 3 characters of city
  const countryCode = country.substring(0, 2).toUpperCase();
  const cityName = name.split(",")[0].trim();
  const cityCode = cityName.substring(0, 3).toUpperCase();
  return `${countryCode}-${cityCode}`;
}

// Get city by code (e.g., "NY-NYC")
export const getByCode = api<GetCityByCodeRequest, GetCityByCodeResponse>(
  { expose: true, method: "GET", path: "/cities/code/:code" },
  async ({ code }) => {
    // Get all cities and search by code
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

    // Find city with matching code
    const city = rows.find((row) => {
      const cityCode = generateCityCode(row.name, row.country);
      return cityCode === code.toUpperCase();
    });

    if (!city) {
      throw APIError.notFound(`City with code ${code} not found`);
    }

    return {
      city: {
        id: city.id,
        name: city.name,
        country: city.country,
        currentPriceUsd: city.current_price_usd,
        lastUpdated: city.last_updated,
      },
    };
  }
);
