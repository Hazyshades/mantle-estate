/**
 * Client for calculating funding through API
 * 
 * Usage:
 *   1. Start Encore application: encore run
 *   2. In another terminal: npx tsx backend/scripts/calculate_funding_client.ts
 * 
 * Or specify the API URL in the ENCORE_API_URL environment variable
 */

const API_URL = process.env.ENCORE_API_URL || "http://localhost:4000";

// Parameters for the position
const positionSizeUsd = 1_256_100;
const entryPrice = 331_468.70;
const cityName = "Chicago";

// Authorization token (need to get from the browser or through API)
// For testing, you can use a temporary token
const AUTH_TOKEN = process.env.AUTH_TOKEN || "";

async function calculateFunding() {
  console.log("🔍 Calculation of funding for the position...");
  console.log(`   Size: $${positionSizeUsd.toLocaleString()}`);
  console.log(`   Entry price: $${entryPrice.toLocaleString()}`);
  console.log(`   City: ${cityName}`);
  console.log("");

  if (!AUTH_TOKEN) {
    console.log("⚠️  ATTENTION: AUTH_TOKEN is not specified");
    console.log("   To work with the script you need to:");
    console.log("   1. Start Encore application: encore run");
    console.log("   2. Get the authorization token from the browser");
    console.log("   3. Set the variable: export AUTH_TOKEN=your_token");
    console.log("");
    console.log("   Or use the API directly through Postman/curl:");
    console.log(`   POST ${API_URL}/trading/calculate-funding`);
    console.log(`   Headers: Authorization: Bearer <token>`);
    console.log(`   Body: { "positionSizeUsd": ${positionSizeUsd}, "entryPrice": ${entryPrice}, "cityName": "${cityName}" }`);
    return;
  }

  try {
    const response = await fetch(`${API_URL}/trading/calculate-funding`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${AUTH_TOKEN}`,
      },
      body: JSON.stringify({
        positionSizeUsd,
        entryPrice,
        cityName,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`❌ API error: ${response.status} ${response.statusText}`);
      console.error(`   ${error}`);
      return;
    }

    const data = await response.json();

    console.log("=".repeat(60));
    console.log(`📊 Position ID: ${data.positionId}`);
    console.log("=".repeat(60));
    console.log(`City: ${data.cityName}`);
    console.log(`Position type: ${data.positionType.toUpperCase()}`);
    console.log(`Position size: $${data.positionSize.toLocaleString()}`);
    console.log(`Entry price: $${data.entryPrice.toLocaleString()}`);
    console.log(`Quantity of sqm: ${data.quantitySqm.toFixed(4)} sqm`);
    console.log(`Leverage: ${data.leverage}x`);
    console.log(`Opened: ${new Date(data.openedAt).toLocaleString('ru-RU')}`);
    console.log("");

    console.log(`⏱️  Time held: ${data.daysHeld.toFixed(2)} days`);
    console.log("");

    console.log(`💰 Actual Funding Rate: ${(data.currentFundingRate * 100).toFixed(4)}%`);
    console.log("");

    console.log("=".repeat(60));
    console.log(`💵 Accumulated Funding Fee`);
    console.log("=".repeat(60));
    const directionText = data.fundingFeeDirection === "pay" ? "PAY" : "GET";
    console.log(`${directionText}: $${data.accumulatedFundingFee.toFixed(2)}`);
    console.log("");

    console.log(`📅 Projected funding fee:`);
    data.projectedFunding.forEach((proj: any) => {
      const dirText = proj.direction === "pay" ? "PAY" : "GET";
      const daysText = proj.days === 1 ? "1 day" : `${proj.days} days`;
      console.log(`   For ${daysText}: ${dirText} $${proj.fee.toFixed(2)}`);
    });

    console.log("");
    console.log("=".repeat(60));
    console.log("✅ Calculation completed");

  } catch (error) {
    console.error("❌ Error calling API:", error);
    console.log("");
    console.log("Make sure:");
    console.log("  1. Encore application is running: encore run");
    console.log("  2. API is available at:", API_URL);
    console.log("  3. Correct AUTH_TOKEN is specified");
  }
}

calculateFunding();

