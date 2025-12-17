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
      RegionName: values[2].replace(/^"|"$/g, ""), // Remove quotes
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

async function rebuildDatabase() {
  console.log("🚀 Starting database rebuild from CSV...");

  try {
    // Step 1: Clear existing data
    console.log("📋 Clearing existing data...");
    await db.exec`DELETE FROM price_history`;
    await db.exec`DELETE FROM cities`;
    console.log("✅ Data cleared");

    // Step 2: Read CSV file
    console.log("📖 Reading CSV file...");
    const csvPath = join(__dirname, "../db/csv_data/Metro_zhvi_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv");
    const csvContent = readFileSync(csvPath, "utf-8");
    const rows = parseCSV(csvContent);

    console.log(`✅ Loaded ${rows.length} rows from CSV`);

    // Step 3: Filter only MSA cities (not country)
    const msaCities = rows.filter((row) => row.RegionType === "msa");
    console.log(`✅ Found ${msaCities.length} MSA cities`);

    // Step 4: Create cities and import price history
    for (const csvRow of msaCities) {
      const cityName = csvRow.RegionName;
      const stateName = csvRow.StateName || "";
      
      // Determine country based on state
      const country = stateName ? "USA" : "Unknown";

      console.log(`\n🏙️  Processing: ${cityName} (${stateName})`);

      // Get all dates from CSV headers
      const dateColumns = Object.keys(csvRow)
        .filter((key) => /^\d{4}-\d{2}-\d{2}$/.test(key))
        .sort(); // Sort by date

      // Find last price for current city price
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

      if (lastPrice === null) {
        console.log(`⚠️  Skipping ${cityName} - no price data`);
        continue;
      }

      // Create city
      const cityResult = await db.queryOne<{ id: number }>`
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

      // Import price history
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
    }

    // Step 5: Output statistics
    const totalCities = await db.queryOne<{ count: number }>`
      SELECT COUNT(*) as count FROM cities
    `;
    const totalPriceHistory = await db.queryOne<{ count: number }>`
      SELECT COUNT(*) as count FROM price_history
    `;

    console.log("\n📊 Statistics:");
    console.log(`   Cities created: ${totalCities?.count || 0}`);
    console.log(`   Price history records: ${totalPriceHistory?.count || 0}`);

    console.log("\n✅ Database rebuild completed successfully!");
  } catch (error) {
    console.error("❌ Error rebuilding database:", error);
    throw error;
  }
}

// Run database rebuild
rebuildDatabase()
  .then(() => {
    console.log("🎉 Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Error executing script:", error);
    process.exit(1);
  });



