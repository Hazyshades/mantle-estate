import db from "../db/index";

/**
 * Export all data from local database to JSON format
 * Run this script locally to export data before migrating to production
 * 
 * Usage: 
 *   cd backend
 *   npx tsx scripts/export_database.ts > database_export.json
 */

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

async function exportDatabase(): Promise<DatabaseExport> {
  console.error("Exporting cities...");
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

  console.error(`Exported ${cities.length} cities`);

  console.error("Exporting price history...");
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

  console.error(`Exported ${priceHistory.length} price history records`);

  console.error("Exporting users...");
  const users = await db.queryAll<{
    id: string;
    email: string | null;
    balance: number;
  }>`
    SELECT id, email, balance
    FROM users
    ORDER BY id
  `;

  console.error(`Exported ${users.length} users`);

  console.error("Exporting positions...");
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

  console.error(`Exported ${positions.length} positions`);

  console.error("Exporting transactions...");
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

  console.error(`Exported ${transactions.length} transactions`);

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

  // For price history, positions, and transactions, we'll export with city name
  // The import endpoint will need to resolve city_id by name
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
    })),
    positions: positions.map(p => {
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
    }),
    transactions: transactions.map(t => {
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
    }),
  };
}

// Run export
exportDatabase()
  .then((data) => {
    console.log(JSON.stringify(data, null, 2));
  })
  .catch((error) => {
    console.error("Export failed:", error);
    process.exit(1);
  });

