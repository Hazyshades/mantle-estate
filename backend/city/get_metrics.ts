import { api, APIError } from "encore.dev/api";
import db from "../db";
import { getMarketMetrics } from "../prices/calculations";

export interface CityMetrics {
  volume24h: number;        // Trading volume for 24 hours (USD)
  openInterest: number;      // Total Open Interest (USD)
  longOI: number;            // Open Interest for Long positions (USD)
  shortOI: number;           // Open Interest for Short positions (USD)
  longOIAvailable: number;   // Available OI for Long (USD)
  shortOIAvailable: number;  // Available OI for Short (USD)
}

interface GetCityMetricsRequest {
  cityId: number;
}

interface GetCityMetricsResponse {
  metrics: CityMetrics;
}

/**
 * Get market metrics for a city
 * GET /cities/:cityId/metrics
 */
export const getCityMetrics = api<GetCityMetricsRequest, GetCityMetricsResponse>(
  { expose: true, method: "GET", path: "/cities/:cityId/metrics" },
  async ({ cityId }) => {
    // Check that the city exists
    const cityExists = await db.queryRow<{ exists: boolean }>`
      SELECT EXISTS(SELECT 1 FROM cities WHERE id = ${cityId}) as exists
    `;

    if (!cityExists?.exists) {
      throw APIError.notFound(`City with id ${cityId} not found`);
    }

    // Get metrics from database
    const marketMetrics = await getMarketMetrics(cityId, db);
    
    const { totalLongValue, totalShortValue, totalOI, volume24h } = marketMetrics;
    
    // Calculate available OI
    // Available OI = total OI - current OI of the opposite side
    // For Long: available = totalShortValue (can open long positions for the amount of short positions)
    // For Short: available = totalLongValue (can open short positions for the amount of long positions)
    const longOIAvailable = totalShortValue;
    const shortOIAvailable = totalLongValue;
    
    return {
      metrics: {
        volume24h,
        openInterest: totalOI,
        longOI: totalLongValue,
        shortOI: totalShortValue,
        longOIAvailable,
        shortOIAvailable,
      },
    };
  }
);
