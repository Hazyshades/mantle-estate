import { api } from "encore.dev/api";
import db from "./index";

interface MigrateDataRequest {
  cities?: Array<{
    name: string;
    country: string;
    current_price_usd: number;
    market_price_usd?: number;
    index_price_usd?: number;
    funding_rate?: number;
    average_property_size_sqft?: number | null;
  }>;
  priceHistory?: Array<{
    city_name: string;
    city_country: string;
    price_usd: number;
    market_price_usd?: number | null;
    index_price_usd?: number | null;
    timestamp: string; // ISO string
  }>;
  users?: Array<{
    id: string;
    email?: string | null;
    balance: number;
  }>;
  positions?: Array<{
    user_id: string;
    city_name: string;
    city_country: string;
    position_type: string;
    quantity_sqm: number;
    entry_price: number;
    leverage: number;
    margin_required: number;
    opening_fee: number;
    opened_at: string; // ISO string
    closed_at?: string | null;
    exit_price?: number | null;
    closing_fee?: number | null;
    pnl?: number | null;
  }>;
  transactions?: Array<{
    user_id: string;
    transaction_type: string;
    city_name: string;
    city_country: string;
    quantity: number;
    price: number;
    fee: number;
    pnl?: number | null;
    timestamp: string; // ISO string
  }>;
}

interface MigrateDataResponse {
  citiesImported: number;
  priceHistoryImported: number;
  usersImported: number;
  positionsImported: number;
  transactionsImported: number;
  message: string;
}

/**
 * Migrate data from local database to production
 * This endpoint accepts JSON data and imports it into the database
 */
export const migrateData = api<MigrateDataRequest, MigrateDataResponse>(
  { expose: true, method: "POST", path: "/db/migrate-data" },
  async (req): Promise<MigrateDataResponse> => {
    let citiesImported = 0;
    let priceHistoryImported = 0;
    let usersImported = 0;
    let positionsImported = 0;
    let transactionsImported = 0;

    // Import cities
    if (req.cities && req.cities.length > 0) {
      for (const city of req.cities) {
        // Check if city exists
        const existing = await db.queryRow<{ id: number }>`
          SELECT id FROM cities WHERE name = ${city.name} AND country = ${city.country}
        `;

        if (existing) {
          // Update existing city
          await db.exec`
            UPDATE cities
            SET 
              current_price_usd = ${city.current_price_usd},
              market_price_usd = ${city.market_price_usd ?? city.current_price_usd},
              index_price_usd = ${city.index_price_usd ?? city.current_price_usd},
              funding_rate = ${city.funding_rate ?? 0},
              average_property_size_sqft = ${city.average_property_size_sqft ?? null},
              last_updated = NOW()
            WHERE id = ${existing.id}
          `;
        } else {
          // Insert new city
          await db.exec`
            INSERT INTO cities (
              name, country, current_price_usd, 
              market_price_usd, index_price_usd, funding_rate,
              average_property_size_sqft
            )
            VALUES (
              ${city.name}, ${city.country}, ${city.current_price_usd},
              ${city.market_price_usd ?? city.current_price_usd},
              ${city.index_price_usd ?? city.current_price_usd},
              ${city.funding_rate ?? 0},
              ${city.average_property_size_sqft ?? null}
            )
          `;
        }
        citiesImported++;
      }
    }

    // Import price history
    if (req.priceHistory && req.priceHistory.length > 0) {
      for (const history of req.priceHistory) {
        // Find city by name and country
        const city = await db.queryRow<{ id: number }>`
          SELECT id FROM cities WHERE name = ${history.city_name} AND country = ${history.city_country}
        `;

        if (city) {
          await db.exec`
            INSERT INTO price_history (
              city_id, price_usd, market_price_usd, index_price_usd, timestamp
            )
            VALUES (
              ${city.id}, 
              ${history.price_usd},
              ${history.market_price_usd ?? null},
              ${history.index_price_usd ?? null},
              ${new Date(history.timestamp)}
            )
            ON CONFLICT DO NOTHING
          `;
          priceHistoryImported++;
        }
      }
    }

    // Import users
    if (req.users && req.users.length > 0) {
      for (const user of req.users) {
        await db.exec`
          INSERT INTO users (id, email, balance, created_at)
          VALUES (${user.id}, ${user.email ?? null}, ${user.balance}, NOW())
          ON CONFLICT (id) DO UPDATE
          SET balance = ${user.balance}, email = ${user.email ?? null}
        `;
        usersImported++;
      }
    }

    // Import positions
    if (req.positions && req.positions.length > 0) {
      for (const position of req.positions) {
        // Find city by name and country
        const city = await db.queryRow<{ id: number }>`
          SELECT id FROM cities WHERE name = ${position.city_name} AND country = ${position.city_country}
        `;

        if (city) {
          await db.exec`
            INSERT INTO positions (
              user_id, city_id, position_type, quantity_sqm, entry_price,
              leverage, margin_required, opening_fee, opened_at,
              closed_at, exit_price, closing_fee, pnl
            )
            VALUES (
              ${position.user_id}, ${city.id}, ${position.position_type},
              ${position.quantity_sqm}, ${position.entry_price}, ${position.leverage},
              ${position.margin_required}, ${position.opening_fee}, ${new Date(position.opened_at)},
              ${position.closed_at ? new Date(position.closed_at) : null},
              ${position.exit_price ?? null}, ${position.closing_fee ?? null}, ${position.pnl ?? null}
            )
          `;
          positionsImported++;
        }
      }
    }

    // Import transactions
    if (req.transactions && req.transactions.length > 0) {
      for (const transaction of req.transactions) {
        // Find city by name and country
        const city = await db.queryRow<{ id: number }>`
          SELECT id FROM cities WHERE name = ${transaction.city_name} AND country = ${transaction.city_country}
        `;

        if (city) {
          await db.exec`
            INSERT INTO transactions (
              user_id, transaction_type, city_id, quantity, price, fee, pnl, timestamp
            )
            VALUES (
              ${transaction.user_id}, ${transaction.transaction_type}, ${city.id},
              ${transaction.quantity}, ${transaction.price}, ${transaction.fee},
              ${transaction.pnl ?? null}, ${new Date(transaction.timestamp)}
            )
          `;
          transactionsImported++;
        }
      }
    }

    return {
      citiesImported,
      priceHistoryImported,
      usersImported,
      positionsImported,
      transactionsImported,
      message: `Successfully imported: ${citiesImported} cities, ${priceHistoryImported} price history records, ${usersImported} users, ${positionsImported} positions, ${transactionsImported} transactions`,
    };
  }
);
