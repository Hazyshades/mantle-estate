import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";
import { getMarketMetrics, calculateIndexPrice, calculateFundingRate } from "../prices/calculations";

interface ClosePositionRequest {
  positionId: number;
}

interface ClosePositionResponse {
  pnl: number;
  closingFee: number;
  newBalance: number;
  exitPrice: number;
}

const FEE_RATE = 0.0001; // 0.01%

// Close an open position
export const closePosition = api<ClosePositionRequest, ClosePositionResponse>(
  { auth: true, expose: true, method: "POST", path: "/trading/close/:positionId" },
  async ({ positionId }) => {
    const auth = getAuthData()!;
    const userId = auth.userID;
    const tx = await db.begin();

    try {
      // Get position details
      const position = await tx.queryRow<{
        user_id: string;
        city_id: number;
        position_type: string;
        quantity_sqm: number;
        entry_price: number;
        margin_required: number;
        opening_fee: number;
        closed_at: Date | null;
      }>`
        SELECT user_id, city_id, position_type, quantity_sqm, entry_price,
               margin_required, opening_fee, closed_at
        FROM positions
        WHERE id = ${positionId}
        FOR UPDATE
      `;

      if (!position) {
        throw APIError.notFound("Position not found");
      }

      if (position.user_id !== userId) {
        throw APIError.permissionDenied("Not your position");
      }

      if (position.closed_at) {
        throw APIError.failedPrecondition("Position already closed");
      }

      // Get current city price (Index Price)
      const city = await tx.queryRow<{ 
        index_price_usd: number;
        market_price_usd: number;
        funding_rate: number;
        last_funding_update: Date | null;
      }>`
        SELECT index_price_usd, market_price_usd, funding_rate, last_funding_update 
        FROM cities WHERE id = ${position.city_id}
      `;
      if (!city) {
        throw APIError.notFound("City not found");
      }

      // Calculate exit price WITHOUT current position's influence
      // This ensures consistency with unrealized P&L calculation
      const allPositions = await tx.queryAll<{
        id: number;
        position_type: string;
        quantity_sqm: number;
        entry_price: number;
      }>`
        SELECT id, position_type, quantity_sqm, entry_price
        FROM positions
        WHERE city_id = ${position.city_id} AND closed_at IS NULL AND id != ${positionId}
      `;

      let totalLongValue = 0;
      let totalShortValue = 0;

      for (const pos of allPositions) {
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

      const exitPrice = calculateIndexPrice(
        city.market_price_usd,
        metricsWithoutCurrent
      );

      // Calculate P&L
      const currentValue = position.quantity_sqm * exitPrice;
      const initialValue = position.quantity_sqm * position.entry_price;
      const closingFee = currentValue * FEE_RATE;

      let grossPnl: number;
      if (position.position_type === "long") {
        grossPnl = currentValue - initialValue;
      } else {
        grossPnl = initialValue - currentValue;
      }

      const netPnl = grossPnl - position.opening_fee - closingFee;
      const returnAmount = position.margin_required + netPnl;

      // Update user balance
      const user = await tx.queryRow<{ balance: number }>`
        SELECT balance FROM users WHERE id = ${userId} FOR UPDATE
      `;
      if (!user) {
        throw APIError.notFound("User not found");
      }

      const newBalance = user.balance + returnAmount;
      await tx.exec`
        UPDATE users SET balance = ${newBalance} WHERE id = ${userId}
      `;

      // Update position
      await tx.exec`
        UPDATE positions
        SET closed_at = NOW(),
            exit_price = ${exitPrice},
            closing_fee = ${closingFee},
            pnl = ${netPnl}
        WHERE id = ${positionId}
      `;

      // Record transaction
      const transactionType = position.position_type === "long" ? "sell" : "short_close";
      await tx.exec`
        INSERT INTO transactions (
          user_id, transaction_type, city_id, quantity,
          price, fee, pnl
        ) VALUES (
          ${userId}, ${transactionType}, ${position.city_id}, ${position.quantity_sqm},
          ${exitPrice}, ${closingFee}, ${netPnl}
        )
      `;

      // Update Index Price and Funding Rate after closing position
      // Get updated metrics (position is already closed, so not included)
      const updatedMetrics = await getMarketMetrics(position.city_id, tx);
      
      // Recalculate Index Price based on new metrics
      const newIndexPrice = calculateIndexPrice(city.market_price_usd, updatedMetrics);
      
      // Calculate Funding Rate
      const lastUpdate = city.last_funding_update ? new Date(city.last_funding_update) : new Date();
      const daysSinceLastUpdate = 
        (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);
      const newFundingRate = calculateFundingRate(
        city.funding_rate,
        updatedMetrics,
        daysSinceLastUpdate
      );
      
      // Update Index Price and Funding Rate in DB
      await tx.exec`
        UPDATE cities
        SET index_price_usd = ${newIndexPrice},
            funding_rate = ${newFundingRate},
            last_funding_update = NOW(),
            last_updated = NOW()
        WHERE id = ${position.city_id}
      `;

      // Save to history
      await tx.exec`
        INSERT INTO price_history (city_id, price_usd, market_price_usd, index_price_usd)
        VALUES (${position.city_id}, ${newIndexPrice}, ${city.market_price_usd}, ${newIndexPrice})
      `;
      
      await tx.exec`
        INSERT INTO market_price_history (
          city_id, market_price_usd, index_price_usd, funding_rate
        ) VALUES (
          ${position.city_id}, ${city.market_price_usd}, ${newIndexPrice}, ${newFundingRate}
        )
      `;

      await tx.commit();

      return {
        pnl: netPnl,
        closingFee,
        newBalance,
        exitPrice,
      };
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }
);
