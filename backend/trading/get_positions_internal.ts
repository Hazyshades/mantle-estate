import db from "../db";
import { calculateIndexPrice } from "../prices/calculations";

export interface Position {
  id: number;
  cityId: number;
  cityName: string;
  positionType: "long" | "short";
  quantitySqm: number;
  entryPrice: number;
  currentPrice: number;
  leverage: number;
  marginRequired: number;
  openedAt: Date;
  currentValue: number;
  unrealizedPnl: number;
  estimatedClosingFee: number;
}

/**
 * Internal function to get user positions by userId.
 * This can be called directly from other services without authentication.
 */
export async function getPositionsInternal(userId: string): Promise<Position[]> {
  const rows = await db.queryAll<{
    id: number;
    city_id: number;
    city_name: string;
    position_type: string;
    quantity_sqm: number;
    entry_price: number;
    market_price_usd: number;
    index_price_usd: number;
    leverage: number;
    margin_required: number;
    opening_fee: number;
    opened_at: Date;
  }>`
    SELECT
      p.id, p.city_id, c.name as city_name, p.position_type,
      p.quantity_sqm, p.entry_price, c.market_price_usd, c.index_price_usd,
      p.leverage, p.margin_required, p.opening_fee, p.opened_at
    FROM positions p
    JOIN cities c ON p.city_id = c.id
    WHERE p.user_id = ${userId} AND p.closed_at IS NULL
    ORDER BY p.opened_at DESC
  `;

  // Get all positions by city for efficient calculation
  const cityIds = [...new Set(rows.map(r => r.city_id))];
  const allCityPositions = await Promise.all(
    cityIds.map(async (cityId) => {
      const positions = await db.queryAll<{
        id: number;
        position_type: string;
        quantity_sqm: number;
        entry_price: number;
      }>`
        SELECT id, position_type, quantity_sqm, entry_price
        FROM positions
        WHERE city_id = ${cityId} AND closed_at IS NULL
      `;
      return { cityId, positions };
    })
  );

  const positionsByCity = new Map(
    allCityPositions.map(cp => [cp.cityId, cp.positions])
  );

  const positions = rows.map((row) => {
    // Get all positions for this city EXCLUDING current position
    const cityPositions = positionsByCity.get(row.city_id) || [];
    const otherPositions = cityPositions.filter(p => p.id !== row.id);

    // Calculate metrics without current position
    let totalLongValue = 0;
    let totalShortValue = 0;

    for (const pos of otherPositions) {
      const value = pos.quantity_sqm * pos.entry_price;
      if (pos.position_type === "long") {
        totalLongValue += value;
      } else {
        totalShortValue += value;
      }
    }

    // Calculate index price without current position's influence
    const metricsWithoutCurrent = {
      totalLongValue,
      totalShortValue,
      totalOI: totalLongValue + totalShortValue,
      volume24h: 0, // Not needed for index price calculation
    };

    const indexPriceWithoutCurrent = calculateIndexPrice(
      row.market_price_usd,
      metricsWithoutCurrent
    );

    // Use index price without current position for P&L calculation
    const currentPrice = indexPriceWithoutCurrent;
    const currentValue = row.quantity_sqm * currentPrice;
    const initialValue = row.quantity_sqm * row.entry_price;
    const FEE_RATE = 0.0001; // 0.01%
    const estimatedClosingFee = currentValue * FEE_RATE;

    let grossPnl: number;
    if (row.position_type === "long") {
      grossPnl = currentValue - initialValue;
    } else {
      grossPnl = initialValue - currentValue;
    }

    const unrealizedPnl = grossPnl - row.opening_fee - estimatedClosingFee;

    return {
      id: row.id,
      cityId: row.city_id,
      cityName: row.city_name,
      positionType: row.position_type as "long" | "short",
      quantitySqm: row.quantity_sqm,
      entryPrice: row.entry_price,
      currentPrice: currentPrice,
      leverage: row.leverage,
      marginRequired: row.margin_required,
      openedAt: row.opened_at,
      currentValue,
      unrealizedPnl,
      estimatedClosingFee,
    };
  });

  return positions;
}
