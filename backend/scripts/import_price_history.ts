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
  const dateColumns = headers.slice(5); // Skip first 5 columns (RegionID, SizeRank, RegionName, RegionType, StateName)

  const rows: CSVRow[] = [];

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

    const row: CSVRow = {
      RegionID: values[0],
      SizeRank: values[1],
      RegionName: values[2],
      RegionType: values[3],
      StateName: values[4],
    };

    // Add all dates as properties
    for (let j = 5; j < values.length && j < headers.length; j++) {
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

async function importPriceHistory() {
  console.log("Starting data import from CSV...");

  // Read CSV file (run from backend; if from .encore/build, need to go up)
  const csvPath = join(__dirname, "../db/csv_data/zhvi_2025-11.30.csv");
  const csvContent = readFileSync(csvPath, "utf-8");
  const rows = parseCSV(csvContent);

  console.log(`Loaded ${rows.length} rows from CSV`);

  // Find cities in DB
  const cities = await db.queryAll<{ id: number; name: string }>`
    SELECT id, name FROM cities WHERE name IN ('New York', 'Miami')
  `;

  console.log(`Found cities in DB: ${cities.length}`);

  // Map city names from CSV to DB names
  const cityMapping: { [key: string]: string } = {
    "New York, NY": "New York",
    "Miami, OK": "Miami",
  };

  for (const csvRow of rows) {
    const cityNameInDB = cityMapping[csvRow.RegionName];
    if (!cityNameInDB) {
      console.log(`Skipping ${csvRow.RegionName} - no mapping`);
      continue;
    }

    const city = cities.find((c) => c.name === cityNameInDB);
    if (!city) {
      console.log(`City ${cityNameInDB} not found in DB`);
      continue;
    }

    console.log(`Processing ${csvRow.RegionName} -> ${cityNameInDB} (ID: ${city.id})`);

    // Get all dates from CSV headers (starting from 2000)
    const dateColumns = Object.keys(csvRow).filter((key) => /^\d{4}-\d{2}-\d{2}$/.test(key));
    dateColumns.sort(); // Sort by date

    // Delete old data for this city (optional, can be commented out)
    console.log(`Deleting old data for ${cityNameInDB}...`);
    await db.exec`
      DELETE FROM price_history WHERE city_id = ${city.id}
    `;

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
      console.log(`Updated current price for ${cityNameInDB}: $${lastPrice.toFixed(2)}`);
    }

    console.log(`Imported ${importedCount} records for ${cityNameInDB}`);
  }

  console.log("Import completed!");
}

// Run import
importPriceHistory()
  .then(() => {
    console.log("Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error executing script:", error);
    process.exit(1);
  });




