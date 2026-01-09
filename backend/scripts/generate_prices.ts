/**
 * Script wrapper to call the generate prices API endpoint
 * 
 * Usage:
 *   1. Start Encore application: encore run (in another terminal)
 *   2. Run this script: bun run scripts/generate_prices.ts
 */

const API_URL = process.env.ENCORE_API_URL || "http://localhost:4000";

async function generatePrices(force: boolean = false) {
  console.log(`Calling API: ${API_URL}/prices/generated-last-month`);
  console.log(`Force mode: ${force ? "ON" : "OFF"}`);
  console.log("");

  try {
    const response = await fetch(`${API_URL}/prices/generated-last-month`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ force }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log("✅ Success!");
    console.log(`Message: ${result.message}`);
    console.log(`Cities updated: ${result.citiesUpdated}`);
  } catch (error) {
    console.error("❌ Error:", error);
    if (error instanceof Error && error.message.includes("ECONNREFUSED")) {
      console.error("");
      console.error("⚠️  Make sure Encore application is running:");
      console.error("   1. Open another terminal");
      console.error("   2. Run: cd backend && encore run");
      console.error("   3. Then run this script again");
    }
    process.exit(1);
  }
}

// Parse command line arguments
const force = process.argv.includes("--force") || process.argv.includes("-f");

generatePrices(force)
  .then(() => {
    console.log("\nScript completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });

