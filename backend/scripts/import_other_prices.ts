import { readFileSync } from "fs";
import { join } from "path";
import db from "../db";

interface CSVRow {
  RegionID: string;
  SizeRank: string;
  RegionName: string;
  RegionType: string;
  StateName: string;
  [date: string]: string;
}

function parseCSV(content: string): CSVRow[] {
  const lines = content.trim().split("\n");
  if (lines.length === 0) return [];

  // Parse headers
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));

  const rows: CSVRow[] = [];

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

    const row: CSVRow = {
      RegionID: values[0]?.replace(/^"|"$/g, "") || "",
      SizeRank: values[1]?.replace(/^"|"$/g, "") || "",
      RegionName: values[2]?.replace(/^"|"$/g, "") || "",
      RegionType: values[3]?.replace(/^"|"$/g, "") || "",
      StateName: values[4]?.replace(/^"|"$/g, "") || "",
    };

    // Add all dates as properties
    for (let j = 5; j < values.length && j < headers.length; j++) {
      const header = headers[j];
      if (header && /^\d{4}-\d{2}-\d{2}$/.test(header)) {
        row[header] = values[j]?.replace(/^"|"$/g, "") || "";
      }
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

// Mapping from CSV RegionName to database city name and country
const cityMapping: { [key: string]: { name: string; country: string } } = {
  "London": { name: "London", country: "UK" },
  "Paris": { name: "Paris", country: "France" },
  "Berlin": { name: "Berlin", country: "Germany" },
  "Dubai": { name: "Dubai", country: "UAE" },
};

async function importOtherPriceHistory() {
  console.log("Starting Other (Europe/Dubai) data import from CSV...");

  // Read CSV file
  const csvPath = join(__dirname, "../db/csv_data/europe.csv");
  const csvContent = readFileSync(csvPath, "utf-8");
  const rows = parseCSV(csvContent);

  console.log(`Loaded ${rows.length} rows from CSV`);

  // Get all cities from DB
  const cities = await db.queryAll<{ id: number; name: string; country: string }>`
    SELECT id, name, country FROM cities
  `;

  console.log(`Found ${cities.length} cities in DB`);

  let totalImported = 0;

  for (const csvRow of rows) {
    const regionName = csvRow.RegionName?.trim();
    if (!regionName) continue;

    const mapping = cityMapping[regionName];
    if (!mapping) {
      console.log(`Skipping ${regionName} - no mapping found`);
      continue;
    }

    // Find city in DB
    const city = cities.find(
      (c) => c.name === mapping.name && c.country === mapping.country
    );

    if (!city) {
      console.log(`City ${mapping.name}, ${mapping.country} not found in DB. Creating...`);
      
      // Get last price from CSV (last non-empty value)
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
        console.log(`No valid price found for ${mapping.name}, skipping...`);
        continue;
      }

      // Insert new city
      try {
        const result = await db.queryOne<{ id: number }>`
          INSERT INTO cities (name, country, current_price_usd, index_price_usd, market_price_usd, funding_rate)
          VALUES (${mapping.name}, ${mapping.country}, ${lastPrice}, ${lastPrice}, ${lastPrice}, 0.0)
          RETURNING id
        `;
        
        if (result) {
          console.log(`Created city ${mapping.name}, ${mapping.country} with ID ${result.id}`);
          // Add to cities array for price history import
          cities.push({ id: result.id, name: mapping.name, country: mapping.country });
          // Continue with price history import
        } else {
          console.log(`Failed to create city ${mapping.name}`);
          continue;
        }
      } catch (error) {
        console.error(`Error creating city ${mapping.name}:`, error);
        continue;
      }
    }

    const cityId = city?.id || cities.find(
      (c) => c.name === mapping.name && c.country === mapping.country
    )?.id;

    if (!cityId) {
      console.log(`Could not find or create city ${mapping.name}`);
      continue;
    }

    console.log(`Processing ${regionName} -> ${mapping.name}, ${mapping.country} (ID: ${cityId})`);

    // Delete old price history for this city
    console.log(`Deleting old price history for ${mapping.name}...`);
    await db.exec`
      DELETE FROM price_history WHERE city_id = ${cityId}
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
          VALUES (${cityId}, ${price}, ${date})
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
        WHERE id = ${cityId}
      `;
      console.log(`Updated prices for ${mapping.name}: $${lastPrice.toFixed(2)}`);
    }

    console.log(`Imported ${importedCount} price history records for ${mapping.name}`);
    totalImported += importedCount;
  }

  console.log(`\nImport completed! Total records imported: ${totalImported}`);
}

// Run import
importOtherPriceHistory()
  .then(() => {
    console.log("Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error executing script:", error);
    process.exit(1);
  });

