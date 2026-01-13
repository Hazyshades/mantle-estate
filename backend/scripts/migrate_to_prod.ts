/**
 * Script for migrating data from local database to production
 * 
 * Usage:
 *   1. Make sure local backend is running: encore run
 *   2. Make sure production API is accessible
 *   3. Run the script: bun run scripts/migrate_to_prod.ts
 * 
 * Environment variables:
 *   PROD_API_URL - Production API URL (required)
 *   EXPORT_FILE - Export file path (default: database_export.json)
 *   LOCAL_API_URL - Local API URL (default: http://localhost:4000)
 *   LOCAL_API_PREFIX - Path prefix for local API (e.g., /real-estate-trading-simulator-t9ii)
 */

import { readFile, writeFile } from "fs/promises";

const PROD_API_URL = process.env.PROD_API_URL;
const EXPORT_FILE = process.env.EXPORT_FILE || "database_export.json";
const LOCAL_API_BASE = process.env.LOCAL_API_URL || "http://localhost:4000";
const LOCAL_API_PREFIX = process.env.LOCAL_API_PREFIX || "";
const LOCAL_API_URL = `${LOCAL_API_BASE}${LOCAL_API_PREFIX}`;

interface DatabaseExport {
  cities: Array<{
    name: string;
    country: string;
    current_price_usd: number;
    market_price_usd: number | null;
    index_price_usd: number | null;
    funding_rate: number;
    average_property_size_sqft: number | null;
  }>;
  priceHistory: Array<{
    city_name: string;
    city_country: string;
    price_usd: number;
    market_price_usd: number | null;
    index_price_usd: number | null;
    timestamp: string;
  }>;
  users: Array<{
    id: string;
    email: string | null;
    balance: number;
    wallet_address: string | null;
  }>;
  positions: Array<{
    user_id: string;
    city_name: string;
    city_country: string;
    position_type: string;
    quantity_sqm: number;
    entry_price: number;
    leverage: number;
    margin_required: number;
    opening_fee: number;
    opened_at: string;
    closed_at: string | null;
    exit_price: number | null;
    closing_fee: number | null;
    pnl: number | null;
  }>;
  transactions: Array<{
    user_id: string;
    transaction_type: string;
    city_name: string;
    city_country: string;
    quantity: number;
    price: number;
    fee: number;
    pnl: number | null;
    timestamp: string;
  }>;
}

interface MigrateResponse {
  citiesImported: number;
  priceHistoryImported: number;
  usersImported: number;
  positionsImported: number;
  transactionsImported: number;
  message: string;
}

async function checkLocalApi(): Promise<boolean> {
  // Try several URL variants
  const urlsToTry = [
    `${LOCAL_API_URL}/db/export-data`,  // Direct endpoint
    `${LOCAL_API_BASE}/db/export-data`,  // Without prefix
    `http://localhost:9400${LOCAL_API_PREFIX || "/real-estate-trading-simulator-t9ii"}/db/export-data`,  // Standard Encore port
    `http://localhost:4000/db/export-data`,  // Standard port without prefix
  ];

  for (const url of urlsToTry) {
    try {
      const response = await fetch(url, {
        method: "GET",
        signal: AbortSignal.timeout(3000),
      });
      if (response.ok) {
        // Update LOCAL_API_URL to the working variant
        const workingUrl = url.replace("/db/export-data", "");
        console.log(`✅ Found working API URL: ${workingUrl}`);
        return true;
      }
    } catch (error) {
      // Continue trying the next URL
      continue;
    }
  }
  return false;
}

async function exportFromLocal(): Promise<DatabaseExport> {
  console.log("📤 Exporting data from local database...");
  
  // Try several URL variants
  const urlsToTry = [
    `${LOCAL_API_URL}/db/export-data`,
    `${LOCAL_API_BASE}/db/export-data`,
    `http://localhost:9400${LOCAL_API_PREFIX || "/real-estate-trading-simulator-t9ii"}/db/export-data`,
    `http://localhost:4000/db/export-data`,
  ];

  let lastError: Error | null = null;
  
  for (const url of urlsToTry) {
    try {
      console.log(`   Attempting connection: ${url}`);
      const response = await fetch(url, {
        method: "GET",
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        lastError = new Error(`HTTP ${response.status}: ${await response.text()}`);
        console.log(`   ❌ Failed: ${lastError.message}`);
        continue; // Try next URL
      }

      const data = await response.json() as DatabaseExport;
      
      console.log(`✅ Export completed with URL: ${url}`);
      console.log(`   - Cities: ${data.cities.length}`);
      console.log(`   - Price history: ${data.priceHistory.length}`);
      console.log(`   - Users: ${data.users.length}`);
      console.log(`   - Positions: ${data.positions.length}`);
      console.log(`   - Transactions: ${data.transactions.length}`);

      return data;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.log(`   ❌ Error: ${lastError.message}`);
      // Continue trying the next URL
      continue;
    }
  }
  
  // If all URLs failed
  throw new Error(
    "❌ Failed to connect to local API on any of the URLs.\n" +
    "   Tried:\n" +
    urlsToTry.map(url => `     - ${url}`).join("\n") +
    "\n\n   Make sure local backend is running: cd backend && encore run\n" +
    "   Or specify the correct URL via environment variable:\n" +
    "   $env:LOCAL_API_URL = 'http://localhost:9400'\n" +
    "   $env:LOCAL_API_PREFIX = '/real-estate-trading-simulator-t9ii'"
  );
}

async function saveExport(data: DatabaseExport, filePath: string): Promise<void> {
  console.log(`\n💾 Saving export to file: ${filePath}`);
  await writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
  console.log("✅ File saved");
}

async function loadExport(filePath: string): Promise<DatabaseExport> {
  console.log(`📂 Loading export from file: ${filePath}`);
  const content = await readFile(filePath, "utf-8");
  const data = JSON.parse(content) as DatabaseExport;
  
  console.log(`✅ File loaded:`);
  console.log(`   - Cities: ${data.cities.length}`);
  console.log(`   - Price history: ${data.priceHistory.length}`);
  console.log(`   - Users: ${data.users.length}`);
  console.log(`   - Positions: ${data.positions.length}`);
  console.log(`   - Transactions: ${data.transactions.length}`);
  
  return data;
}

async function importToProd(data: DatabaseExport): Promise<MigrateResponse> {
  if (!PROD_API_URL) {
    throw new Error(
      "❌ PROD_API_URL is not set.\n" +
      "   Set environment variable: export PROD_API_URL=https://your-app.encr.app"
    );
  }

  console.log(`\n📥 Importing data to production database...`);
  console.log(`   API URL: ${PROD_API_URL}`);
  console.log(`   Data to import:`);
  console.log(`     - Cities: ${data.cities.length}`);
  console.log(`     - Price history: ${data.priceHistory.length}`);
  console.log(`     - Users: ${data.users.length}`);
  console.log(`     - Positions: ${data.positions.length}`);
  console.log(`     - Transactions: ${data.transactions.length}`);
  console.log(`   ⏳ Import may take several minutes for large data volumes...`);

  try {
    const startTime = Date.now();
    const response = await fetch(`${PROD_API_URL}/db/migrate-data`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(600000), // 10 minute timeout for large imports
    });
    
    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json() as MigrateResponse;
    
    console.log(`\n✅ Import completed successfully in ${elapsedTime} seconds!`);
    console.log(`   - Cities: ${result.citiesImported}`);
    console.log(`   - Price history: ${result.priceHistoryImported}`);
    console.log(`   - Users: ${result.usersImported}`);
    console.log(`   - Positions: ${result.positionsImported}`);
    console.log(`   - Transactions: ${result.transactionsImported}`);
    console.log(`\n   ${result.message}`);

    return result;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("ECONNREFUSED") || error.message.includes("ENOTFOUND")) {
        throw new Error(
          `❌ Failed to connect to production API: ${PROD_API_URL}\n` +
          "   Check URL correctness and server availability"
        );
      }
      if (error.message.includes("timeout")) {
        throw new Error(
          "❌ Timeout during data import.\n" +
          "   Try importing data in parts or increase the timeout"
        );
      }
    }
    throw error;
  }
}

async function main() {
  console.log("🚀 Starting data migration from local database to production\n");

  // Check for PROD_API_URL
  if (!PROD_API_URL) {
    console.error("❌ Error: PROD_API_URL is not set");
    console.error("\nUsage:");
    console.error("  export PROD_API_URL=https://your-app.encr.app");
    console.error("  bun run scripts/migrate_to_prod.ts");
    console.error("\nOr:");
    console.error("  PROD_API_URL=https://your-app.encr.app bun run scripts/migrate_to_prod.ts");
    process.exit(1);
  }

  // Check operation mode
  const useExistingFile = process.argv.includes("--use-file") || process.argv.includes("-f");
  const exportOnly = process.argv.includes("--export-only") || process.argv.includes("-e");
  const importOnly = process.argv.includes("--import-only") || process.argv.includes("-i");

  try {
    let exportData: DatabaseExport;

    if (importOnly) {
      // Import only from existing file
      exportData = await loadExport(EXPORT_FILE);
    } else {
      // Check local API
      console.log("🔍 Checking local API...");
      const localApiAvailable = await checkLocalApi();
      
      if (!localApiAvailable) {
        console.warn("⚠️  Local API is unavailable");
        if (useExistingFile) {
          console.log("📂 Using existing export file...");
          exportData = await loadExport(EXPORT_FILE);
        } else {
          throw new Error(
            "❌ Local API is unavailable and export file is not specified.\n" +
            "   Start local backend: cd backend && encore run\n" +
            "   Or use existing file: --use-file"
          );
        }
      } else {
        // Export from local database
        exportData = await exportFromLocal();
        
        // Save to file
        await saveExport(exportData, EXPORT_FILE);
      }
    }

    // Import to production (if not export only)
    if (!exportOnly) {
      await importToProd(exportData);
    } else {
      console.log("\n✅ Export completed. File saved for subsequent import.");
      console.log(`   To import, run: bun run scripts/migrate_to_prod.ts --import-only`);
    }

    console.log("\n🎉 Migration completed successfully!");
  } catch (error) {
    console.error("\n❌ Error during migration:");
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

main();

