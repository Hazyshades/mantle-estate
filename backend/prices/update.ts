import { api } from "encore.dev/api";
import { CronJob } from "encore.dev/cron";
import db from "../db";

export const updatePricesEndpoint = api(
  { expose: false, method: "POST", path: "/prices/update" },
  async (): Promise<void> => {
    const cities = await db.queryAll<{
      id: number;
      current_price_usd: number;
    }>`
      SELECT id, current_price_usd FROM cities
    `;

    for (const city of cities) {
      const fluctuation = (Math.random() - 0.5) * 0.01;
      const newPrice = city.current_price_usd * (1 + fluctuation);

      await db.exec`
        UPDATE cities
        SET current_price_usd = ${newPrice},
            last_updated = NOW()
        WHERE id = ${city.id}
      `;

      await db.exec`
        INSERT INTO price_history (city_id, price_usd)
        VALUES (${city.id}, ${newPrice})
      `;
    }
  }
);

const updatePrices = new CronJob("update-prices", {
  title: "Update city prices",
  every: "5m",
  endpoint: updatePricesEndpoint,
});
