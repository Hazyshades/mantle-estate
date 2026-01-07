import { api } from "encore.dev/api";
import db from "./index";

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

/**
 * Export all data from database to JSON format
 * This endpoint can be called when Encore is running to export all data
 */
export const exportData = api<void, DatabaseExport>(
  { expose: true, method: "GET", path: "/db/export-data" },
  async (): Promise<DatabaseExport> => {
    // Export cities
    const cities = await db.queryAll<{
      name: string;
      country: string;
      current_price_usd: number;
      market_price_usd: number | null;
      index_price_usd: number | null;
      funding_rate: number;
      average_property_size_sqft: number | null;
    }>`
      SELECT 
        name, country, current_price_usd,
        market_price_usd, index_price_usd, funding_rate,
        average_property_size_sqft
      FROM cities
      ORDER BY id
    `;

    // Export price history
    const priceHistory = await db.queryAll<{
      city_id: number;
      price_usd: number;
      market_price_usd: number | null;
      index_price_usd: number | null;
      timestamp: Date;
    }>`
      SELECT 
        city_id, price_usd, market_price_usd, index_price_usd, timestamp
      FROM price_history
      ORDER BY city_id, timestamp
    `;

    // Export users
    const users = await db.queryAll<{
      id: string;
      email: string | null;
      balance: number;
      wallet_address: string | null;
    }>`
      SELECT id, email, balance, wallet_address
      FROM users
      ORDER BY id
    `;

    // Export positions
    const positions = await db.queryAll<{
      user_id: string;
      city_id: number;
      position_type: string;
      quantity_sqm: number;
      entry_price: number;
      leverage: number;
      margin_required: number;
      opening_fee: number;
      opened_at: Date;
      closed_at: Date | null;
      exit_price: number | null;
      closing_fee: number | null;
      pnl: number | null;
    }>`
      SELECT 
        user_id, city_id, position_type, quantity_sqm, entry_price,
        leverage, margin_required, opening_fee, opened_at,
        closed_at, exit_price, closing_fee, pnl
      FROM positions
      ORDER BY opened_at
    `;

    // Export transactions
    const transactions = await db.queryAll<{
      user_id: string;
      transaction_type: string;
      city_id: number;
      quantity: number;
      price: number;
      fee: number;
      pnl: number | null;
      timestamp: Date;
    }>`
      SELECT 
        user_id, transaction_type, city_id, quantity, price, fee, pnl, timestamp
      FROM transactions
      ORDER BY timestamp
    `;

    // Get city mapping: local city_id -> city name
    const cityMapping = await db.queryAll<{
      id: number;
      name: string;
      country: string;
    }>`
      SELECT id, name, country FROM cities ORDER BY id
    `;

    const cityIdToName = new Map<number, { name: string; country: string }>();
    cityMapping.forEach(city => {
      cityIdToName.set(city.id, { name: city.name, country: city.country });
    });

    // Map price history with city names
    const priceHistoryWithMapping = priceHistory.map(ph => {
      const cityInfo = cityIdToName.get(ph.city_id);
      return {
        city_name: cityInfo?.name || `UNKNOWN_${ph.city_id}`,
        city_country: cityInfo?.country || "UNKNOWN",
        price_usd: ph.price_usd,
        market_price_usd: ph.market_price_usd,
        index_price_usd: ph.index_price_usd,
        timestamp: ph.timestamp.toISOString(),
      };
    });

    // Map positions with city names
    const positionsWithMapping = positions.map(p => {
      const cityInfo = cityIdToName.get(p.city_id);
      return {
        user_id: p.user_id,
        city_name: cityInfo?.name || `UNKNOWN_${p.city_id}`,
        city_country: cityInfo?.country || "UNKNOWN",
        position_type: p.position_type,
        quantity_sqm: p.quantity_sqm,
        entry_price: p.entry_price,
        leverage: p.leverage,
        margin_required: p.margin_required,
        opening_fee: p.opening_fee,
        opened_at: p.opened_at.toISOString(),
        closed_at: p.closed_at ? p.closed_at.toISOString() : null,
        exit_price: p.exit_price,
        closing_fee: p.closing_fee,
        pnl: p.pnl,
      };
    });

    // Map transactions with city names
    const transactionsWithMapping = transactions.map(t => {
      const cityInfo = cityIdToName.get(t.city_id);
      return {
        user_id: t.user_id,
        transaction_type: t.transaction_type,
        city_name: cityInfo?.name || `UNKNOWN_${t.city_id}`,
        city_country: cityInfo?.country || "UNKNOWN",
        quantity: t.quantity,
        price: t.price,
        fee: t.fee,
        pnl: t.pnl,
        timestamp: t.timestamp.toISOString(),
      };
    });

    return {
      cities: cities.map(c => ({
        name: c.name,
        country: c.country,
        current_price_usd: c.current_price_usd,
        market_price_usd: c.market_price_usd,
        index_price_usd: c.index_price_usd,
        funding_rate: c.funding_rate,
        average_property_size_sqft: c.average_property_size_sqft,
      })),
      priceHistory: priceHistoryWithMapping,
      users: users.map(u => ({
        id: u.id,
        email: u.email,
        balance: u.balance,
        wallet_address: u.wallet_address,
      })),
      positions: positionsWithMapping,
      transactions: transactionsWithMapping,
    };
  }
);

