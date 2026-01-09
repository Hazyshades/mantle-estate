import { api } from "encore.dev/api";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import db from "../db";

// Get __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface ImportPricesResponse {
  success: boolean;
  message: string;
  imported: {
    city: string;
    records: number;
    lastPrice: number;
  }[];
}

function parseCSV(content: string): Array<Record<string, string>> {
  const lines = content.trim().split("\n");
  if (lines.length === 0) return [];

  // Parse headers
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));

  const rows: Array<Record<string, string>> = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
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

    if (values.length < 5) continue; // At least RegionID, SizeRank, RegionName, RegionType, StateName

    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length && j < values.length; j++) {
      row[headers[j]] = values[j]?.replace(/^"|"$/g, "") || "";
    }

    rows.push(row);
  }

  return rows;
}

function parseDate(dateStr: string): Date | null {
  // Format: "2000-01-31"
  const parts = dateStr.split("-");
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0]);
  const month = parseInt(parts[1]) - 1; // JavaScript months start at 0
  const day = parseInt(parts[2]);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  return new Date(year, month, day);
}

// Import USA price history from zhvi_2025-11.30.csv file
export const importUSAPriceHistory = api<void, ImportPricesResponse>(
  { expose: true, method: "POST", path: "/cities/import-usa-price-history" },
  async () => {
    try {
      // Read USA CSV file
      const csvPath = join(
        __dirname,
        "../../../../db/csv_data/zhvi_2025-11.30.csv"
      );
      const csvContent = readFileSync(csvPath, "utf-8");
      const rows = parseCSV(csvContent);

      // Mapping from CSV RegionName to database city name and country
      const cityMapping: { [key: string]: { name: string; country: string } } = {
        "New York, NY": { name: "New York, NY", country: "USA" },
        "Los Angeles, CA": { name: "Los Angeles, CA", country: "USA" },
        "Chicago, IL": { name: "Chicago, IL", country: "USA" },
        "Dallas, TX": { name: "Dallas, TX", country: "USA" },
        "Houston, TX": { name: "Houston, TX", country: "USA" },
        "Washington, DC": { name: "Washington, DC", country: "USA" },
        "Philadelphia, PA": { name: "Philadelphia, PA", country: "USA" },
        "Miami, FL": { name: "Miami, FL", country: "USA" },
      };

      // Get all cities from DB
      const cities = await db.queryAll<{ id: number; name: string; country: string }>`
        SELECT id, name, country FROM cities
      `;

      const imported: { city: string; records: number; lastPrice: number }[] = [];

      for (const csvRow of rows) {
        const regionName = csvRow["RegionName"]?.replace(/^"|"$/g, "").trim() || "";
        if (!regionName) continue;

        const mapping = cityMapping[regionName];
        if (!mapping) {
          continue;
        }

        // Find city in DB
        let city = cities.find(
          (c) => c.name === mapping.name && c.country === mapping.country
        );

        // If city doesn't exist, create it
        if (!city) {
          // Get last price from CSV
          const dateColumns = Object.keys(csvRow)
            .filter((key) => /^\d{4}-\d{2}-\d{2}$/.test(key))
            .sort();
          
          let lastPrice: number | null = null;
          for (let i = dateColumns.length - 1; i >= 0; i--) {
            const priceStr = csvRow[dateColumns[i]];
            if (priceStr && priceStr.trim() !== "") {
              const price = parseFloat(priceStr);
              if (!isNaN(price) && price > 0) {
                lastPrice = price;
                break;
              }
            }
          }

          if (!lastPrice) {
            continue;
          }

          // Create new city
          const result = await db.queryRow<{ id: number }>`
            INSERT INTO cities (name, country, current_price_usd, index_price_usd, market_price_usd, funding_rate)
            VALUES (${mapping.name}, ${mapping.country}, ${lastPrice}, ${lastPrice}, ${lastPrice}, 0.0)
            RETURNING id
          `;
          
          if (result) {
            city = { id: result.id, name: mapping.name, country: mapping.country };
            cities.push(city);
          } else {
            continue;
          }
        }

        // Delete old price history for this city
        await db.exec`
          DELETE FROM price_history WHERE city_id = ${city.id}
        `;

        // Get all dates from CSV
        const dateColumns = Object.keys(csvRow)
          .filter((key) => /^\d{4}-\d{2}-\d{2}$/.test(key))
          .sort();

        // Import data
        let importedCount = 0;
        let lastPrice: number | null = null;

        for (const dateStr of dateColumns) {
          const priceStr = csvRow[dateStr];
          if (!priceStr || priceStr.trim() === "") continue;

          const price = parseFloat(priceStr);
          if (isNaN(price) || price <= 0) continue;

          const date = parseDate(dateStr);
          if (!date) continue;

          try {
            await db.exec`
              INSERT INTO price_history (city_id, price_usd, timestamp)
              VALUES (${city.id}, ${price}, ${date})
              ON CONFLICT DO NOTHING
            `;
            importedCount++;
            lastPrice = price;
          } catch (error) {
            // Ignore duplicate errors
            if (!String(error).includes("duplicate") && !String(error).includes("unique")) {
              console.error(`Error importing data for ${dateStr}:`, error);
            }
          }
        }

        // Update current price, index_price, and market_price in cities table
        if (lastPrice !== null) {
          await db.exec`
            UPDATE cities
            SET current_price_usd = ${lastPrice},
                index_price_usd = ${lastPrice},
                market_price_usd = ${lastPrice},
                last_updated = NOW()
            WHERE id = ${city.id}
          `;
        }

        imported.push({
          city: `${mapping.name}, ${mapping.country}`,
          records: importedCount,
          lastPrice: lastPrice!,
        });
      }

      return {
        success: true,
        message: `Imported USA data for ${imported.length} cities`,
        imported,
      };
    } catch (error) {
      return {
        success: false,
        message: `USA import error: ${error instanceof Error ? error.message : String(error)}`,
        imported: [],
      };
    }
  }
);




