import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

interface OpenPositionRequest {
  cityId: number;
  positionType: "long" | "short";
  amountUsd: number;
  leverage?: number;
}

interface OpenPositionResponse {
  positionId: number;
  quantitySqm: number;
  entryPrice: number;
  fee: number;
  newBalance: number;
}

const FEE_RATE = 0.001; // 0.1%

// Open a new position (buy/short)
export const openPosition = api<OpenPositionRequest, OpenPositionResponse>(
  { auth: true, expose: true, method: "POST", path: "/trading/open" },
  async (req) => {
    const auth = getAuthData()!;
    const userId = auth.userID;
    const { cityId, positionType, amountUsd, leverage = 1 } = req;

    // Validate inputs
    if (amountUsd <= 0) {
      throw APIError.invalidArgument("Amount must be positive");
    }
    if (leverage !== 1 && leverage !== 2) {
      throw APIError.invalidArgument("Leverage must be 1 or 2");
    }
    if (positionType !== "long" && positionType !== "short") {
      throw APIError.invalidArgument("Position type must be 'long' or 'short'");
    }

    // Start transaction
    const tx = await db.begin();

    try {
      // Get user balance
      const user = await tx.queryRow<{ balance: number }>`
        SELECT balance FROM users WHERE id = ${userId} FOR UPDATE
      `;
      if (!user) {
        throw APIError.notFound("User not found");
      }

      // Get current city price
      const city = await tx.queryRow<{ current_price_usd: number }>`
        SELECT current_price_usd FROM cities WHERE id = ${cityId}
      `;
      if (!city) {
        throw APIError.notFound("City not found");
      }

      const currentPrice = city.current_price_usd;

      // Calculate position details
      const positionValue = amountUsd * leverage;
      const quantitySqm = positionValue / currentPrice;
      const openingFee = positionValue * FEE_RATE;
      const totalCost = amountUsd + openingFee;

      // Check if user has sufficient balance
      if (user.balance < totalCost) {
        throw APIError.failedPrecondition("Insufficient balance");
      }

      // Deduct from user balance
      const newBalance = user.balance - totalCost;
      await tx.exec`
        UPDATE users SET balance = ${newBalance} WHERE id = ${userId}
      `;

      // Create position
      const position = await tx.queryRow<{ id: number }>`
        INSERT INTO positions (
          user_id, city_id, position_type, quantity_sqm,
          entry_price, leverage, margin_required, opening_fee
        ) VALUES (
          ${userId}, ${cityId}, ${positionType}, ${quantitySqm},
          ${currentPrice}, ${leverage}, ${amountUsd}, ${openingFee}
        )
        RETURNING id
      `;

      // Record transaction
      const transactionType = positionType === "long" ? "buy" : "short_open";
      await tx.exec`
        INSERT INTO transactions (
          user_id, transaction_type, city_id, quantity,
          price, fee, pnl
        ) VALUES (
          ${userId}, ${transactionType}, ${cityId}, ${quantitySqm},
          ${currentPrice}, ${openingFee}, NULL
        )
      `;

      await tx.commit();

      return {
        positionId: position!.id,
        quantitySqm,
        entryPrice: currentPrice,
        fee: openingFee,
        newBalance,
      };
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }
);
