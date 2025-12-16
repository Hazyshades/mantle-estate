import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

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
}

interface GetPositionsResponse {
  positions: Position[];
}

// Get user's open positions
export const getPositions = api<void, GetPositionsResponse>(
  { auth: true, expose: true, method: "GET", path: "/trading/positions" },
  async () => {
    const auth = getAuthData()!;
    const userId = auth.userID;
    const rows = await db.queryAll<{
      id: number;
      city_id: number;
      city_name: string;
      position_type: string;
      quantity_sqm: number;
      entry_price: number;
      current_price_usd: number;
      leverage: number;
      margin_required: number;
      opening_fee: number;
      opened_at: Date;
    }>`
      SELECT
        p.id, p.city_id, c.name as city_name, p.position_type,
        p.quantity_sqm, p.entry_price, c.current_price_usd,
        p.leverage, p.margin_required, p.opening_fee, p.opened_at
      FROM positions p
      JOIN cities c ON p.city_id = c.id
      WHERE p.user_id = ${userId} AND p.closed_at IS NULL
      ORDER BY p.opened_at DESC
    `;

    const positions = rows.map((row) => {
      const currentValue = row.quantity_sqm * row.current_price_usd;
      const initialValue = row.quantity_sqm * row.entry_price;
      const FEE_RATE = 0.001;
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
        currentPrice: row.current_price_usd,
        leverage: row.leverage,
        marginRequired: row.margin_required,
        openedAt: row.opened_at,
        currentValue,
        unrealizedPnl,
      };
    });

    return { positions };
  }
);
