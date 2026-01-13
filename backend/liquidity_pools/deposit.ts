import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";
import { getOrCreatePool, calculateSharesToMint } from "./utils";

interface DepositRequest {
  cityId: number;
  amount: number; // USDC
}

interface DepositResponse {
  poolId: number;
  sharesMinted: number;
  pricePerShare: number;
  newTotalLiquidity: number;
  newBalance: number;
}

const MIN_DEPOSIT = 10.0; // Minimum deposit 10 USDC

export const deposit = api<DepositRequest, DepositResponse>(
  { auth: true, expose: true, method: "POST", path: "/liquidity-pools/deposit" },
  async (req) => {
    const auth = getAuthData()!;
    const userId = auth.userID;
    const { cityId, amount } = req;

    // Validation
    if (amount < MIN_DEPOSIT) {
      throw APIError.invalidArgument(`Minimum deposit is ${MIN_DEPOSIT} USDC`);
    }

    const tx = await db.begin();

    try {
      // Get user balance
      const user = await tx.queryRow<{ balance: number }>`
        SELECT balance FROM users WHERE id = ${userId} FOR UPDATE
      `;
      
      if (!user) {
        throw APIError.notFound("User not found");
      }

      if (user.balance < amount) {
        throw APIError.failedPrecondition("Insufficient balance");
      }

      // Get or create pool
      const pool = await getOrCreatePool(cityId, tx);

      // Calculate shares to mint (at current price)
      const sharesToMint = calculateSharesToMint(
        amount,
        pool.totalLiquidity,
        pool.totalShares
      );

      // Update pool: add liquidity and shares
      const newTotalLiquidity = pool.totalLiquidity + amount;
      const newTotalShares = pool.totalShares + sharesToMint;
      
      await tx.exec`
        UPDATE liquidity_pools
        SET total_liquidity = ${newTotalLiquidity},
            total_shares = ${newTotalShares},
            updated_at = NOW()
        WHERE id = ${pool.id}
      `;

      // Update or create LP position for user
      const existingPosition = await tx.queryRow<{ id: number; shares: number; deposited_amount: number }>`
        SELECT id, shares, deposited_amount
        FROM lp_positions
        WHERE user_id = ${userId} AND pool_id = ${pool.id}
      `;

      if (existingPosition) {
        await tx.exec`
          UPDATE lp_positions
          SET shares = ${existingPosition.shares + sharesToMint},
              deposited_amount = ${existingPosition.deposited_amount + amount},
              updated_at = NOW()
          WHERE id = ${existingPosition.id}
        `;
      } else {
        await tx.exec`
          INSERT INTO lp_positions (
            user_id, pool_id, shares, deposited_amount
          ) VALUES (
            ${userId}, ${pool.id}, ${sharesToMint}, ${amount}
          )
        `;
      }

      // Deduct from user balance
      const newBalance = user.balance - amount;
      await tx.exec`
        UPDATE users SET balance = ${newBalance} WHERE id = ${userId}
      `;

      // Record transaction
      const pricePerShare = newTotalLiquidity / newTotalShares;
      await tx.exec`
        INSERT INTO lp_transactions (
          user_id, pool_id, transaction_type, amount, shares, price_per_share
        ) VALUES (
          ${userId}, ${pool.id}, 'deposit', ${amount}, ${sharesToMint}, ${pricePerShare}
        )
      `;

      await tx.commit();

      return {
        poolId: pool.id,
        sharesMinted: sharesToMint,
        pricePerShare,
        newTotalLiquidity: newTotalLiquidity,
        newBalance,
      };
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }
);
