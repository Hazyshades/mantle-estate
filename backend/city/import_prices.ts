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

interface RebuildDatabaseResponse {
  success: boolean;
  message: string;
  citiesCreated: number;
  priceHistoryRecords: number;
  cities: {
    name: string;
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

function parseDate(dateStr: string): Date | null {
  // Format: "2000-01-31"
  const parts = dateStr.split("-");
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0]);
  const month = parseInt(parts[1]) - 1; // JavaScript months start at 0
  const day = parseInt(parts[2]);
  return new Date(year, month, day);
}

// Import price history from CSV file
export const importPriceHistory = api<void, ImportPricesResponse>(
  { expose: true, method: "POST", path: "/cities/import-prices" },
  async () => {
    try {
      // Read CSV file
      // When running through Encore, services work from .encore/build/combined, so we go up to backend root
      const csvPath = join(
        __dirname,
        "../../../../db/csv_data/Metro_zhvi_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv"
      );
      const csvContent = readFileSync(csvPath, "utf-8");
      const rows = parseCSV(csvContent);

      // Find cities in DB
      const cities = await db.queryAll<{ id: number; name: string }>`
        SELECT id, name FROM cities WHERE name IN ('New York', 'Miami')
      `;

      // Map city names from CSV to DB names
      const cityMapping: { [key: string]: string } = {
        "New York, NY": "New York",
        "Miami, FL": "Miami",
      };

      const imported: { city: string; records: number; lastPrice: number }[] = [];

      for (const csvRow of rows) {
        const regionName = csvRow["RegionName"]?.replace(/^"|"$/g, "") || "";
        const cityNameInDB = cityMapping[regionName];
        if (!cityNameInDB) {
          continue;
        }

        const city = cities.find((c) => c.name === cityNameInDB);
        if (!city) {
          continue;
        }

        // Delete old data for this city
        await db.exec`
          DELETE FROM price_history WHERE city_id = ${city.id}
        `;

        // Get all dates from CSV (starting from 2000)
        const dateColumns = Object.keys(csvRow).filter((key) => /^\d{4}-\d{2}-\d{2}$/.test(key));
        dateColumns.sort(); // Sort by date

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

          // Check that date >= 2000-01-01
          if (date < new Date("2000-01-01")) continue;

          try {
            await db.exec`
              INSERT INTO price_history (city_id, price_usd, timestamp)
              VALUES (${city.id}, ${price}, ${date})
            `;
            importedCount++;
            lastPrice = price;
          } catch (error) {
            console.error(`Error importing data for ${dateStr}:`, error);
          }
        }

        // Update current price in cities table
        if (lastPrice !== null) {
          await db.exec`
            UPDATE cities
            SET current_price_usd = ${lastPrice},
                last_updated = NOW()
            WHERE id = ${city.id}
          `;
        }

        imported.push({
          city: cityNameInDB,
          records: importedCount,
          lastPrice: lastPrice!,
        });
      }

      return {
        success: true,
        message: `Imported data for ${imported.length} cities`,
        imported,
      };
    } catch (error) {
      return {
        success: false,
        message: `Import error: ${error instanceof Error ? error.message : String(error)}`,
        imported: [],
      };
    }
  }
);

// Rebuild entire database from CSV file
export const rebuildDatabase = api<void, RebuildDatabaseResponse>(
  { expose: true, method: "POST", path: "/cities/rebuild-database" },
  async () => {
    try {
      console.log("🚀 Starting database rebuild from CSV...");

      // Step 1: Clear existing data (dependent tables first)
      console.log("📋 Clearing existing data...");
      await db.exec`DELETE FROM price_history`;
      await db.exec`DELETE FROM transactions`;
      await db.exec`DELETE FROM positions`;
      await db.exec`DELETE FROM cities`;
      console.log("✅ Data cleared");

      // Step 2: Read CSV file
      console.log("📖 Reading CSV file...");
      const csvPath = join(
        __dirname,
        "../../../../db/csv_data/Metro_zhvi_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv"
      );
      const csvContent = readFileSync(csvPath, "utf-8");
      const rows = parseCSV(csvContent);

      console.log(`✅ Loaded ${rows.length} rows from CSV`);

      // Step 3: Filter only MSA cities (not country)
      const msaCities = rows.filter((row) => row["RegionType"] === "msa");
      console.log(`✅ Found ${msaCities.length} MSA cities`);

      const createdCities: { name: string; records: number; lastPrice: number }[] = [];

      // Step 4: Create cities and import price history
      for (const csvRow of msaCities) {
        const cityName = csvRow["RegionName"]?.replace(/^"|"$/g, "") || "";
        const stateName = csvRow["StateName"] || "";

        // Determine country based on state
        const country = stateName ? "USA" : "Unknown";

        console.log(`\n🏙️  Processing: ${cityName} (${stateName})`);

        // Get all dates from CSV headers
        const allDateColumns = Object.keys(csvRow)
          .filter((key) => /^\d{4}-\d{2}-\d{2}$/.test(key))
          .sort(); // Sort by date

        // Filter dates: only from 2018-01-01 to current date
        const minDate = new Date("2018-01-01");
        const maxDate = new Date(); // Current date
        const dateColumns = allDateColumns.filter((dateStr) => {
          const date = parseDate(dateStr);
          return date && date >= minDate && date <= maxDate;
        });

        const firstDate = dateColumns.length > 0 ? dateColumns[0] : "none";
        const lastDate = dateColumns.length > 0 ? dateColumns[dateColumns.length - 1] : "none";
        console.log(`   📅 Found ${allDateColumns.length} dates in CSV, filtered to ${dateColumns.length} dates (from 2018: ${firstDate} - ${lastDate})`);

        // Find last price for current city price
        let lastPrice: number | null = null;
        for (let i = allDateColumns.length - 1; i >= 0; i--) {
          const priceStr = csvRow[allDateColumns[i]];
          if (priceStr && priceStr.trim() !== "") {
            const price = parseFloat(priceStr);
            if (!isNaN(price) && price > 0) {
              lastPrice = price;
              break;
            }
          }
        }

        if (lastPrice === null) {
          console.log(`⚠️  Skipping ${cityName} - no price data`);
          continue;
        }

        // Create city
        const cityResult = await db.queryRow<{ id: number }>`
          INSERT INTO cities (name, country, current_price_usd, last_updated)
          VALUES (${cityName}, ${country}, ${lastPrice}, NOW())
          RETURNING id
        `;

        if (!cityResult) {
          console.log(`❌ Error creating city ${cityName}`);
          continue;
        }

        const cityId = cityResult.id;
        console.log(`✅ Created city ${cityName} (ID: ${cityId}, current price: $${lastPrice.toFixed(2)})`);

        // Import price history (only from 2018)
        let importedCount = 0;
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
              VALUES (${cityId}, ${price}, ${date})
            `;
            importedCount++;
          } catch (error) {
            console.error(`❌ Error importing data for ${dateStr}:`, error);
          }
        }

        console.log(`✅ Imported ${importedCount} price history records for ${cityName}`);

        createdCities.push({
          name: cityName,
          records: importedCount,
          lastPrice: lastPrice,
        });
      }

      // Step 5: Output statistics
      const totalCities = await db.queryRow<{ count: number }>`
        SELECT COUNT(*) as count FROM cities
      `;
      const totalPriceHistory = await db.queryRow<{ count: number }>`
        SELECT COUNT(*) as count FROM price_history
      `;

      console.log("\n📊 Statistics:");
      console.log(`   Cities created: ${totalCities?.count || 0}`);
      console.log(`   Price history records: ${totalPriceHistory?.count || 0}`);

      console.log("\n✅ Database rebuild completed successfully!");

      return {
        success: true,
        message: `Database successfully rebuilt. Created ${totalCities?.count || 0} cities and ${totalPriceHistory?.count || 0} price history records (from 2018 to current date).`,
        citiesCreated: totalCities?.count || 0,
        priceHistoryRecords: totalPriceHistory?.count || 0,
        cities: createdCities,
      };
    } catch (error) {
      console.error("❌ Error rebuilding database:", error);
      return {
        success: false,
        message: `Database rebuild error: ${error instanceof Error ? error.message : String(error)}`,
        citiesCreated: 0,
        priceHistoryRecords: 0,
        cities: [],
      };
    }
  }
);

// Import APAC price history from apac.csv file
export const importAPACPriceHistory = api<void, ImportPricesResponse>(
  { expose: true, method: "POST", path: "/cities/import-apac-prices" },
  async () => {
    try {
      // Read APAC CSV file
      const csvPath = join(
        __dirname,
        "../../../../db/csv_data/apac.csv"
      );
      const csvContent = readFileSync(csvPath, "utf-8");
      const rows = parseCSV(csvContent);

      // Mapping from CSV RegionName to database city name and country
      const cityMapping: { [key: string]: { name: string; country: string } } = {
        "Tokyo": { name: "Tokyo", country: "Japan" },
        "Singapore": { name: "Singapore", country: "Singapore" },
        "Hong Kong": { name: "Hong Kong", country: "Hong Kong" },
        "Shanghai": { name: "Shanghai", country: "China" },
        "Sydney": { name: "Sydney", country: "Australia" },
        "Seoul": { name: "Seoul", country: "South Korea" },
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
        message: `Imported APAC data for ${imported.length} cities`,
        imported,
      };
    } catch (error) {
      return {
        success: false,
        message: `APAC import error: ${error instanceof Error ? error.message : String(error)}`,
        imported: [],
      };
    }
  }
);

// Import Europe and Other cities price history from other.csv file
export const importOtherPriceHistory = api<void, ImportPricesResponse>(
  { expose: true, method: "POST", path: "/cities/import-other-prices" },
  async () => {
    try {
      // Read other CSV file
      const csvPath = join(
        __dirname,
        "../../../../db/csv_data/other.csv"
      );
      const csvContent = readFileSync(csvPath, "utf-8");
      const rows = parseCSV(csvContent);

      // Mapping from CSV RegionName to database city name and country
      const cityMapping: { [key: string]: { name: string; country: string } } = {
        "London": { name: "London", country: "UK" },
        "Paris": { name: "Paris", country: "France" },
        "Berlin": { name: "Berlin", country: "Germany" },
        "Dubai": { name: "Dubai", country: "UAE" },
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
        message: `Imported Other (Europe/Dubai) data for ${imported.length} cities`,
        imported,
      };
    } catch (error) {
      return {
        success: false,
        message: `Other import error: ${error instanceof Error ? error.message : String(error)}`,
        imported: [],
      };
    }
  }
);



