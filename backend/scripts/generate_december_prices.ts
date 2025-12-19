import db from "../db";

/**
 * Generates prices for all cities from December 1 to December 17, 2025
 * based on the last price (November 30) with fluctuations of ±0.1-0.3%
 */
async function generateDecemberPrices() {
  console.log("Starting December price generation...");

  // Get all cities
  const cities = await db.queryAll<{
    id: number;
    name: string;
  }>`
    SELECT id, name FROM cities
  `;

  console.log(`Found cities: ${cities.length}`);

  // For each city
  for (const city of cities) {
    // Find the last record (November 30)
    const lastPriceRecord = await db.queryRow<{
      price_usd: number;
      market_price_usd: number | null;
      index_price_usd: number | null;
      timestamp: Date;
    }>`
      SELECT price_usd, market_price_usd, index_price_usd, timestamp
      FROM price_history
      WHERE city_id = ${city.id}
      ORDER BY timestamp DESC
      LIMIT 1
    `;

    if (!lastPriceRecord) {
      console.log(`⚠️  City ${city.name} (ID: ${city.id}) has no historical data, skipping`);
      continue;
    }

    const basePrice = lastPriceRecord.index_price_usd || lastPriceRecord.price_usd;
    const baseMarketPrice = lastPriceRecord.market_price_usd || basePrice;
    const lastDate = new Date(lastPriceRecord.timestamp);
    
    console.log(`\nCity: ${city.name} (ID: ${city.id})`);
    console.log(`  Last date: ${lastDate.toISOString().split('T')[0]}`);
    console.log(`  Base price (Index): $${basePrice.toFixed(2)}`);
    console.log(`  Base price (Market): $${baseMarketPrice.toFixed(2)}`);

    // Generate data from December 1 to December 17, 2025
    const startDate = new Date("2025-12-01");
    const endDate = new Date("2025-12-17");
    let currentPrice = basePrice;
    let currentMarketPrice = baseMarketPrice;
    let insertedCount = 0;

    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      // Generate random change from -0.3% to +0.3%
      const minChange = -0.003; // -0.3%
      const maxChange = 0.003;  // +0.3%
      const randomChange = Math.random() * (maxChange - minChange) + minChange;
      
      // Apply change to prices
      currentPrice = currentPrice * (1 + randomChange);
      currentMarketPrice = currentMarketPrice * (1 + randomChange);

      // Set time to start of day (00:00:00)
      const timestamp = new Date(date);
      timestamp.setHours(0, 0, 0, 0);

      // Check if a record already exists for this date
      const dateStr = timestamp.toISOString().split('T')[0]; // YYYY-MM-DD
      const dayStart = new Date(timestamp);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(timestamp);
      dayEnd.setHours(23, 59, 59, 999);
      
      const existing = await db.queryRow<{ count: number }>`
        SELECT COUNT(*) as count
        FROM price_history
        WHERE city_id = ${city.id} 
          AND timestamp >= ${dayStart}
          AND timestamp <= ${dayEnd}
      `;

      if (existing && existing.count > 0) {
        console.log(`  ⚠️  Record for ${dateStr} already exists, skipping`);
        continue;
      }

      // Insert new record
      try {
        await db.exec`
          INSERT INTO price_history (
            city_id, 
            price_usd, 
            market_price_usd, 
            index_price_usd, 
            timestamp
          )
          VALUES (
            ${city.id}, 
            ${currentPrice}, 
            ${currentMarketPrice}, 
            ${currentPrice}, 
            ${timestamp}
          )
        `;
        insertedCount++;
      } catch (error) {
        console.error(`  ❌ Error inserting data for ${timestamp.toISOString().split('T')[0]}:`, error);
      }
    }

    console.log(`  ✅ Records inserted: ${insertedCount}`);
  }

  console.log("\n✅ Generation completed!");
}

// Run the script
generateDecemberPrices()
  .then(() => {
    console.log("Script executed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error executing script:", error);
    process.exit(1);
  });

