import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";
import { calculateFillPrice, getMarketMetrics, calculateIndexPrice, calculateFundingRate } from "../prices/calculations";

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

const FEE_RATE = 0.0001; // 0.01%

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

      // Get current city price (Index Price)
      const city = await tx.queryRow<{ 
        index_price_usd: number;
        market_price_usd: number;
        funding_rate: number;
        last_funding_update: Date | null;
      }>`
        SELECT index_price_usd, market_price_usd, funding_rate, last_funding_update FROM cities WHERE id = ${cityId}
      `;
      if (!city) {
        throw APIError.notFound("City not found");
      }

      // Get metrics for fill price calculation
      const metrics = await getMarketMetrics(cityId, tx);
      const tradeSize = amountUsd * leverage; // Trade size in USD
      
      // Calculate current skew
      const currentSkew = metrics.totalLongValue - metrics.totalShortValue;
      
      // Calculate fill price
      const { fillPrice } = calculateFillPrice(
        city.index_price_usd,
        currentSkew,
        tradeSize,
        positionType
      );

      // using fillPrice instead of indexPrice
      const currentPrice = fillPrice;

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

      // Update Index Price and Funding Rate after creating position
      // Get updated metrics (already including new position)
      const updatedMetrics = await getMarketMetrics(cityId, tx);
      
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
        WHERE id = ${cityId}
      `;
      
      // Save to history
      await tx.exec`
        INSERT INTO price_history (city_id, price_usd, market_price_usd, index_price_usd)
        VALUES (${cityId}, ${newIndexPrice}, ${city.market_price_usd}, ${newIndexPrice})
      `;
      
      await tx.exec`
        INSERT INTO market_price_history (
          city_id, market_price_usd, index_price_usd, funding_rate
        ) VALUES (
          ${cityId}, ${city.market_price_usd}, ${newIndexPrice}, ${newFundingRate}
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
