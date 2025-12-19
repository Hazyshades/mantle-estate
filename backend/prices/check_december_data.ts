import { api } from "encore.dev/api";
import db from "../db";

/**
 * Checks for December 2025 data in the database
 */
export const checkDecemberData = api<void, { 
  cities: Array<{
    cityId: number;
    cityName: string;
    lastDate: string | null;
    decemberRecords: number;
    dates: string[];
  }>;
  summary: {
    totalCities: number;
    citiesWithData: number;
    totalRecords: number;
  };
}>(
  { expose: true, method: "GET", path: "/prices/check-december" },
  async () => {
    // Get all cities
    const cities = await db.queryAll<{
      id: number;
      name: string;
    }>`
      SELECT id, name FROM cities ORDER BY name
    `;

    const result = {
      cities: [] as Array<{
        cityId: number;
        cityName: string;
        lastDate: string | null;
        decemberRecords: number;
        dates: string[];
      }>,
      summary: {
        totalCities: cities.length,
        citiesWithData: 0,
        totalRecords: 0,
      },
    };

    // For each city, check data
    for (const city of cities) {
      // Find the last record
      const lastRecord = await db.queryRow<{
        timestamp: Date;
      }>`
        SELECT timestamp
        FROM price_history
        WHERE city_id = ${city.id}
        ORDER BY timestamp DESC
        LIMIT 1
      `;

      // Check records for December 2025 (December 1-17)
      const decemberStart = new Date("2025-12-01");
      decemberStart.setHours(0, 0, 0, 0);
      const decemberEnd = new Date("2025-12-17");
      decemberEnd.setHours(23, 59, 59, 999);

      const decemberRecords = await db.queryAll<{
        timestamp: Date;
      }>`
        SELECT timestamp
        FROM price_history
        WHERE city_id = ${city.id}
          AND timestamp >= ${decemberStart}
          AND timestamp <= ${decemberEnd}
        ORDER BY timestamp ASC
      `;

      const dates = decemberRecords.map(r => r.timestamp.toISOString().split('T')[0]);
      const uniqueDates = [...new Set(dates)];

      if (decemberRecords.length > 0) {
        result.summary.citiesWithData++;
        result.summary.totalRecords += decemberRecords.length;
      }

      result.cities.push({
        cityId: city.id,
        cityName: city.name,
        lastDate: lastRecord ? lastRecord.timestamp.toISOString().split('T')[0] : null,
        decemberRecords: decemberRecords.length,
        dates: uniqueDates.sort(),
      });
    }

    return result;
  }
);

