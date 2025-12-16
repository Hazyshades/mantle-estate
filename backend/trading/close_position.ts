import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

interface ClosePositionRequest {
  positionId: number;
}

interface ClosePositionResponse {
  pnl: number;
  closingFee: number;
  newBalance: number;
  exitPrice: number;
}

const FEE_RATE = 0.001; // 0.1%

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

      // Get current city price
      const city = await tx.queryRow<{ current_price_usd: number }>`
        SELECT current_price_usd FROM cities WHERE id = ${position.city_id}
      `;
      if (!city) {
        throw APIError.notFound("City not found");
      }

      const exitPrice = city.current_price_usd;

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
