import db from "../db";

/**
 * Script for calculating funding fee for an existing position from the database
 * 
 * Finds a position by parameters and calculates the accumulated funding
 */

// Parameters for the position
const positionSizeUsd = 1_256_100; // Position size in USD
const entryPrice = 331_468.70; // Entry price
const cityName = "Chicago"; // City name

interface PositionData {
  id: number;
  user_id: string;
  city_id: number;
  city_name: string;
  position_type: string;
  quantity_sqm: number;
  entry_price: number;
  leverage: number;
  margin_required: number;
  opened_at: Date;
  current_funding_rate: number;
  days_held: number;
}

async function calculatePositionFunding() {
  console.log("🔍 Searching for a position...");
  console.log(`   Size: $${positionSizeUsd.toLocaleString()}`);
  console.log(`   Entry price: $${entryPrice.toLocaleString()}`);
  console.log(`   City: ${cityName}`);
  console.log("");

  // Find the position by parameters
  // Search for positions for Chicago with similar parameters
  const positions = await db.queryAll<{
    id: number;
    user_id: string;
    city_id: number;
    city_name: string;
    position_type: string;
    quantity_sqm: number;
    entry_price: number;
    leverage: number;
    margin_required: number;
    opened_at: Date;
    position_value: number;
  }>`
    SELECT 
      p.id, p.user_id, p.city_id, c.name as city_name,
      p.position_type, p.quantity_sqm, p.entry_price,
      p.leverage, p.margin_required, p.opened_at,
      (p.quantity_sqm * p.entry_price) as position_value
    FROM positions p
    JOIN cities c ON p.city_id = c.id
    WHERE c.name = ${cityName}
      AND p.closed_at IS NULL
      AND ABS((p.quantity_sqm * p.entry_price) - ${positionSizeUsd}) < 1000
      AND ABS(p.entry_price - ${entryPrice}) < 100
    ORDER BY p.opened_at DESC
  `;

  if (positions.length === 0) {
    console.log("❌ Position not found!");
    console.log("\nTry to find all open positions for Chicago:");
    
    const allPositions = await db.queryAll<{
      id: number;
      user_id: string;
      position_type: string;
      quantity_sqm: number;
      entry_price: number;
      leverage: number;
      margin_required: number;
      position_value: number;
      opened_at: Date;
    }>`
      SELECT 
        p.id, p.user_id, p.position_type, p.quantity_sqm, p.entry_price,
        p.leverage, p.margin_required, p.opened_at,
        (p.quantity_sqm * p.entry_price) as position_value
      FROM positions p
      JOIN cities c ON p.city_id = c.id
      WHERE c.name = ${cityName} AND p.closed_at IS NULL
      ORDER BY p.opened_at DESC
    `;

    if (allPositions.length === 0) {
      console.log("No open positions for Chicago");
    } else {
      console.log(`\n   Found ${allPositions.length} open positions:`);
      allPositions.forEach((pos, idx) => {
        console.log(`\n   ${idx + 1}. Position ID: ${pos.id}`);
        console.log(`      Type: ${pos.position_type.toUpperCase()}`);
        console.log(`      Size: $${pos.position_value.toLocaleString()}`);
        console.log(`      Entry price: $${pos.entry_price.toLocaleString()}`);
        console.log(`      Quantity: ${pos.quantity_sqm.toFixed(4)} sqm`);
        console.log(`      Leverage: ${pos.leverage}x`);
        console.log(`      Opened: ${pos.opened_at.toLocaleString('ru-RU')}`);
      });
    }
    return;  
  }

  // Get the actual funding rate for the city
  const city = await db.queryRow<{
    id: number;
    name: string;
    funding_rate: number;
    index_price_usd: number;
    last_funding_update: Date | null;
  }>`
    SELECT id, name, funding_rate, index_price_usd, last_funding_update
    FROM cities
    WHERE name = ${cityName}
  `;

  if (!city) {
    console.log(`❌ City ${cityName} not found in the database`);
    return;
  }

  console.log(`✅ Found ${positions.length} positions(s)`);
  console.log("");

  // Process each found position
  for (const pos of positions) {
    console.log("=".repeat(60));
    console.log(`📊 Position ID: ${pos.id}`);
    console.log("=".repeat(60));
    console.log(`Position type: ${pos.position_type.toUpperCase()}`);
    console.log(`Position size: $${pos.position_value.toLocaleString()}`);
    console.log(`Entry price: $${pos.entry_price.toLocaleString()}`);
    console.log(`Quantity of sqm: ${pos.quantity_sqm.toFixed(4)} sqm`);
    console.log(`Leverage: ${pos.leverage}x`);
    console.log(`Margin: $${pos.margin_required.toLocaleString()}`);
    console.log(`Opened: ${pos.opened_at.toLocaleString('ru-RU')}`);
    console.log("");

    // Calculate the time held
    const now = new Date();
    const openedAt = new Date(pos.opened_at);
    const daysHeld = (now.getTime() - openedAt.getTime()) / (1000 * 60 * 60 * 24);
    const hoursHeld = daysHeld * 24;

    console.log(`⏱️  Time held:`);
    console.log(`   Days: ${daysHeld.toFixed(2)}`);
    console.log(`   Hours: ${hoursHeld.toFixed(2)}`);
    console.log("");

    // Get the actual funding rate
    console.log(`💰 Actual Funding Rate for ${city.name}:`);
    console.log(`   ${(city.funding_rate * 100).toFixed(4)}%`);
    if (city.last_funding_update) {
      console.log(`   Updated: ${city.last_funding_update.toLocaleString('ru-RU')}`);
    }
    console.log("");

    // Calculate the funding fee
    // Formula: Funding Fee = Position Size × Funding Rate × Days
    const fundingFee = pos.position_value * city.funding_rate * daysHeld;

    // Determine the direction of payment
    let feeDirection: string;
    let feeAmount: number;

    if (pos.position_type === "long") {
      // Long pays if funding rate is positive
      feeAmount = city.funding_rate > 0 ? -fundingFee : fundingFee;
      feeDirection = city.funding_rate > 0 ? "PAY" : "GET";
    } else {
      // Short gets if funding rate is positive
      feeAmount = city.funding_rate > 0 ? fundingFee : -fundingFee;
      feeDirection = city.funding_rate > 0 ? "GET" : "PAY";
    }

    console.log("=".repeat(60));
    console.log(`💵 Calculation of Funding Fee`);
    console.log("=".repeat(60));
    console.log(`Formula: Position Size × Funding Rate × Days`);
    console.log(`   = $${pos.position_value.toLocaleString()} × ${(city.funding_rate * 100).toFixed(4)}% × ${daysHeld.toFixed(2)} days`);
    console.log("");
    console.log(`📈 Accumulated Funding Fee:`);
    console.log(`   ${feeDirection}: $${Math.abs(feeAmount).toFixed(2)}`);
    console.log("");

    // Calculate funding for different periods
    console.log(`📅 Forecast of funding fee:`);
    const periods = [
      { days: 1, label: "1 day" },
      { days: 7, label: "7 days" },
      { days: 30, label: "30 days" },
      { days: 90, label: "90 days" },
    ];

    for (const period of periods) {
      const periodFee = pos.position_value * city.funding_rate * period.days;
      const periodDirection = pos.position_type === "long" 
        ? (city.funding_rate > 0 ? "PAY" : "GET")
        : (city.funding_rate > 0 ? "GET" : "PAY");
      const periodAmount = pos.position_type === "long"
        ? (city.funding_rate > 0 ? -periodFee : periodFee)
        : (city.funding_rate > 0 ? periodFee : -periodFee);
      
      console.log(`   For ${period.label}: ${periodDirection} $${Math.abs(periodAmount).toFixed(2)}`);
    }

    console.log("");
    console.log("=".repeat(60));
    console.log("");
  }
}

// Run the script
calculatePositionFunding()
  .then(() => {
    console.log("✅ Calculation completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });

