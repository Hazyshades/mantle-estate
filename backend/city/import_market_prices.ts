import { api } from "encore.dev/api";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import db from "../db";
import { calculateIndexPrice, getMarketMetrics } from "../prices/calculations";

// Get __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface ImportMarketPricesResponse {
  success: boolean;
  message: string;
  citiesUpdated: number;
}

function parseCSV(content: string): Array<Record<string, string>> {
  const lines = content.trim().split("\n");
  if (lines.length === 0) return [];

  // Parse headers
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));

  const rows: Array<Record<string, string>> = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // Simple CSV parsing with quote handling
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim()); // Last value

    if (values.length < headers.length) continue;

    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length && j < values.length; j++) {
      row[headers[j]] = values[j];
    }

    rows.push(row);
  }

  return rows;
}

/**
 * Import Market Price from Zillow CSV file
 * Updates market_price_usd for all cities from CSV data
 */
export const importMarketPrices = api<void, ImportMarketPricesResponse>(
  { expose: true, method: "POST", path: "/cities/import-market-prices" },
  async () => {
    try {
      // read CSV file
      const csvPath = join(
        __dirname,
        "../../../../db/csv_data/Metro_zhvi_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv"
      );
      const csvContent = readFileSync(csvPath, "utf-8");
      const rows = parseCSV(csvContent);
      
      // Get all cities from DB
      const dbCities = await db.queryAll<{ id: number; name: string }>`
        SELECT id, name FROM cities
      `;
      
      // Create mapping: name from CSV -> name in DB
      // Use exact match of name or create mapping for known cities
      const cityMapping: Record<string, string> = {};
      
      // Fill mapping based on existing cities
      for (const dbCity of dbCities) {
        // Try to find match in CSV
        for (const csvRow of rows) {
          const regionName = csvRow["RegionName"]?.replace(/^"|"$/g, "") || "";
          // If name matches or contains city name from DB
          if (regionName === dbCity.name || regionName.includes(dbCity.name.split(",")[0])) {
            cityMapping[regionName] = dbCity.name;
            break;
          }
        }
      }
      
      let citiesUpdated = 0;
      
      // Process each CSV row
      for (const csvRow of rows) {
        const regionName = csvRow["RegionName"]?.replace(/^"|"$/g, "") || "";
        const dbCityName = cityMapping[regionName] || regionName;
        
        // Find city in DB
        const city = dbCities.find((c) => c.name === dbCityName);
        
        if (!city) continue;
        
        // Find latest available price in CSV (rightmost column with data)
        const dateColumns = Object.keys(csvRow)
          .filter((key) => /^\d{4}-\d{2}-\d{2}$/.test(key))
          .sort()
          .reverse(); // From newest to oldest
        
        let latestPrice: number | null = null;
        let latestDate: string | null = null;
        
        for (const dateStr of dateColumns) {
          const priceStr = csvRow[dateStr];
          if (!priceStr || priceStr.trim() === "") continue;
          
          const price = parseFloat(priceStr);
          if (isNaN(price) || price <= 0) continue;
          
          latestPrice = price;
          latestDate = dateStr;
          break; // Take first found price (the newest)
        }
        
        if (!latestPrice || !latestDate) continue;
        
        // Update Market Price in DB
        await db.exec`
          UPDATE cities
          SET market_price_usd = ${latestPrice},
              last_updated = NOW()
          WHERE id = ${city.id}
        `;
        
        // Get market metrics and recalculate Index Price
        const metrics = await getMarketMetrics(city.id, db);
        const currentMarketPrice = latestPrice;
        const newIndexPrice = calculateIndexPrice(currentMarketPrice, metrics);
        
        // Update Index Price
        await db.exec`
          UPDATE cities
          SET index_price_usd = ${newIndexPrice}
          WHERE id = ${city.id}
        `;
        
        // Save to history
        const currentFundingRate = await db.queryRow<{ funding_rate: number }>`
          SELECT funding_rate FROM cities WHERE id = ${city.id}
        `;
        
        await db.exec`
          INSERT INTO market_price_history (
            city_id, market_price_usd, index_price_usd, funding_rate
          ) VALUES (
            ${city.id}, ${currentMarketPrice}, ${newIndexPrice},
            ${currentFundingRate?.funding_rate || 0}
          )
        `;
        
        citiesUpdated++;
      }
      
      return {
        success: true,
        message: `Updated ${citiesUpdated} cities with Market Price from CSV`,
        citiesUpdated,
      };
    } catch (error) {
      return {
        success: false,
        message: `Import error: ${error instanceof Error ? error.message : String(error)}`,
        citiesUpdated: 0,
      };
    }
  }
);



