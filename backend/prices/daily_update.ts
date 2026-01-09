import { api } from "encore.dev/api";
import { CronJob } from "encore.dev/cron";
import db from "../db";
import { calculateIndexPrice, calculateFundingRate, getMarketMetrics } from "./calculations";

export const dailyPriceUpdateEndpoint = api(
  { expose: true, method: "POST", path: "/prices/daily-update" },
  async (): Promise<{ updated: number; message: string }> => {
    console.log("[Daily Price Update] Starting market price update...");
    
    // Get all cities with their current market prices
    const cities = await db.queryAll<{
      id: number;
      market_price_usd: number;
    }>`
      SELECT id, market_price_usd
      FROM cities
    `;

    let updatedCount = 0;
    for (const city of cities) {
      // Generate random percentage change between -1% and +1%
      const minChange = -0.01; // -1%
      const maxChange = 0.01; // +1.5%
      const randomChange = Math.random() * (maxChange - minChange) + minChange;
      
      // Calculate new Market Price
      const oldPrice = city.market_price_usd;
      const newMarketPrice = city.market_price_usd * (1 + randomChange);
      
      // Get market metrics to recalculate Index Price
      const metrics = await getMarketMetrics(city.id, db);
      
      // Recalculate Index Price based on new Market Price
      const newIndexPrice = calculateIndexPrice(newMarketPrice, metrics);
      
      // Get current funding rate info
      const cityData = await db.queryRow<{
        funding_rate: number;
        last_funding_update: Date;
      }>`
        SELECT funding_rate, last_funding_update
        FROM cities
        WHERE id = ${city.id}
      `;
      
      // Calculate Funding Rate
      const lastUpdate = cityData?.last_funding_update ? new Date(cityData.last_funding_update) : new Date();
      const daysSinceLastUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);
      const newFundingRate = calculateFundingRate(
        cityData?.funding_rate || 0,
        metrics,
        daysSinceLastUpdate
      );
      
      // Update market_price_usd, index_price_usd, funding_rate and last_market_price_update
      await db.exec`
        UPDATE cities
        SET market_price_usd = ${newMarketPrice},
            index_price_usd = ${newIndexPrice},
            funding_rate = ${newFundingRate},
            last_market_price_update = NOW(),
            last_funding_update = NOW(),
            last_updated = NOW()
        WHERE id = ${city.id}
      `;
      
      // Save to price history
      await db.exec`
        INSERT INTO price_history (city_id, price_usd, market_price_usd, index_price_usd)
        VALUES (${city.id}, ${newIndexPrice}, ${newMarketPrice}, ${newIndexPrice})
      `;
      
      // Save to market_price_history
      await db.exec`
        INSERT INTO market_price_history (
          city_id, market_price_usd, index_price_usd, funding_rate
        ) VALUES (
          ${city.id}, ${newMarketPrice}, ${newIndexPrice}, ${newFundingRate}
        )
      `;
      
      updatedCount++;
      console.log(`[Daily Price Update] City ${city.id}: Market ${oldPrice.toFixed(2)} -> ${newMarketPrice.toFixed(2)} (${(randomChange * 100).toFixed(2)}%), Index: ${newIndexPrice.toFixed(2)}`);
    }
    
    console.log(`[Daily Price Update] Completed. Updated ${updatedCount} cities.`);
    
    return {
      updated: updatedCount,
      message: `Successfully updated market prices for ${updatedCount} cities`,
    };
  }
);

const dailyPriceUpdate = new CronJob("daily-price-update", {
  title: "Market Price Update (Every 6 hours)",
  schedule: "0 */6 * * *", // Every 6 hours at the start of the hour
  endpoint: dailyPriceUpdateEndpoint,
});






