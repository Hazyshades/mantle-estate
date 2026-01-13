import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";
import { getOrCreatePool, calculateWithdrawAmount } from "./utils";

interface WithdrawRequest {
  poolId: number;
  shares: number; // Number of shares to withdraw
}

interface WithdrawResponse {
  amountWithdrawn: number;
  sharesBurned: number;
  pricePerShare: number;
  newBalance: number;
}

export const withdraw = api<WithdrawRequest, WithdrawResponse>(
  { auth: true, expose: true, method: "POST", path: "/liquidity-pools/withdraw" },
  async (req) => {
    const auth = getAuthData()!;
    const userId = auth.userID;
    const { poolId, shares } = req;

    if (shares <= 0) {
      throw APIError.invalidArgument("Shares must be positive");
    }

    const tx = await db.begin();

    try {
      // Check pool
      const pool = await tx.queryRow<{
        id: number;
        totalLiquidity: number;
        totalShares: number;
      }>`
        SELECT id, total_liquidity as "totalLiquidity", total_shares as "totalShares"
        FROM liquidity_pools
        WHERE id = ${poolId}
        FOR UPDATE
      `;

      if (!pool) {
        throw APIError.notFound("Pool not found");
      }

      // Check user LP position
      const lpPosition = await tx.queryRow<{ shares: number; withdrawn_amount: number }>`
        SELECT shares, withdrawn_amount FROM lp_positions
        WHERE user_id = ${userId} AND pool_id = ${poolId}
        FOR UPDATE
      `;

      if (!lpPosition) {
        throw APIError.notFound("No LP position found");
      }

      if (lpPosition.shares < shares) {
        throw APIError.failedPrecondition("Insufficient shares");
      }

      // Calculate withdrawal amount at current share price
      const amountToWithdraw = calculateWithdrawAmount(
        shares,
        pool.totalLiquidity,
        pool.totalShares
      );

      // Update pool: burn shares, decrease liquidity
      const newTotalLiquidity = pool.totalLiquidity - amountToWithdraw;
      const newTotalShares = pool.totalShares - shares;

      await tx.exec`
        UPDATE liquidity_pools
        SET total_liquidity = ${newTotalLiquidity},
            total_shares = ${newTotalShares},
            updated_at = NOW()
        WHERE id = ${poolId}
      `;

      // Update user LP position
      await tx.exec`
        UPDATE lp_positions
        SET shares = ${lpPosition.shares - shares},
            withdrawn_amount = ${lpPosition.withdrawn_amount + amountToWithdraw},
            updated_at = NOW()
        WHERE user_id = ${userId} AND pool_id = ${poolId}
      `;

      // Add USDC to user balance
      const user = await tx.queryRow<{ balance: number }>`
        SELECT balance FROM users WHERE id = ${userId} FOR UPDATE
      `;

      const newBalance = user.balance + amountToWithdraw;
      await tx.exec`
        UPDATE users SET balance = ${newBalance} WHERE id = ${userId}
      `;

      // Record transaction
      const pricePerShare = newTotalShares > 0 ? newTotalLiquidity / newTotalShares : 0;
      await tx.exec`
        INSERT INTO lp_transactions (
          user_id, pool_id, transaction_type, amount, shares, price_per_share
        ) VALUES (
          ${userId}, ${poolId}, 'withdraw', ${amountToWithdraw}, ${shares}, ${pricePerShare}
        )
      `;

      await tx.commit();

      return {
        amountWithdrawn: amountToWithdraw,
        sharesBurned: shares,
        pricePerShare,
        newBalance,
      };
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }
);
