import { api } from "encore.dev/api";
import { CronJob } from "encore.dev/cron";
import db from "../db";
import { calculateIndexPrice, calculateFundingRate, getMarketMetrics } from "./calculations";

export const updatePricesEndpoint = api(
  { expose: false, method: "POST", path: "/prices/update" },
  async (): Promise<void> => {
    const cities = await db.queryAll<{
      id: number;
      market_price_usd: number;
      index_price_usd: number;
      funding_rate: number;
      last_funding_update: Date;
    }>`
      SELECT id, market_price_usd, index_price_usd, funding_rate, last_funding_update
      FROM cities
    `;

    for (const city of cities) {
      // Get market metrics
      const metrics = await getMarketMetrics(city.id, db);
      
      // Recalculate Index Price based on Market Price and metrics
      const newIndexPrice = calculateIndexPrice(city.market_price_usd, metrics);
      
      // Calculate Funding Rate
      const lastUpdate = city.last_funding_update ? new Date(city.last_funding_update) : new Date();
      const daysSinceLastUpdate = 
        (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);
      const newFundingRate = calculateFundingRate(
        city.funding_rate,
        metrics,
        daysSinceLastUpdate
      );
      
      // Update prices in DB
      await db.exec`
        UPDATE cities
        SET index_price_usd = ${newIndexPrice},
            funding_rate = ${newFundingRate},
            last_funding_update = NOW(),
            last_updated = NOW()
        WHERE id = ${city.id}
      `;

      // Save both prices to history
      await db.exec`
        INSERT INTO price_history (city_id, price_usd, market_price_usd, index_price_usd)
        VALUES (${city.id}, ${newIndexPrice}, ${city.market_price_usd}, ${newIndexPrice})
      `;
      
      // Save to market_price_history
      await db.exec`
        INSERT INTO market_price_history (
          city_id, market_price_usd, index_price_usd, funding_rate
        ) VALUES (
          ${city.id}, ${city.market_price_usd}, ${newIndexPrice}, ${newFundingRate}
        )
      `;
    }
  }
);

const updatePrices = new CronJob("update-prices", {
  title: "Update Index Prices and Funding Rates",
  every: "5m", // Update every 5 minutes
  endpoint: updatePricesEndpoint,
});
