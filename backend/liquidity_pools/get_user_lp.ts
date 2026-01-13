import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

interface UserLpPosition {
  poolId: number;
  cityId: number;
  cityName: string;
  shares: number;
  depositedAmount: number;
  withdrawnAmount: number;
  currentValue: number;
  pricePerShare: number;
  profit: number; // Current profit (currentValue - depositedAmount + withdrawnAmount)
  profitPercent: number; // Profit percentage
}

interface GetUserLpResponse {
  positions: UserLpPosition[];
}

export const getUserLp = api<void, GetUserLpResponse>(
  { auth: true, expose: true, method: "GET", path: "/liquidity-pools/user" },
  async () => {
    const auth = getAuthData()!;
    const userId = auth.userID;

    const positions = await db.queryAll<{
      poolId: number;
      cityId: number;
      cityName: string;
      shares: number;
      depositedAmount: number;
      withdrawnAmount: number;
      pricePerShare: number;
    }>`
      SELECT 
        lp.id as "poolId",
        c.id as "cityId",
        c.name as "cityName",
        lpp.shares,
        lpp.deposited_amount as "depositedAmount",
        lpp.withdrawn_amount as "withdrawnAmount",
        CASE 
          WHEN lp.total_shares > 0 THEN lp.total_liquidity / lp.total_shares
          ELSE 1.0
        END as "pricePerShare"
      FROM lp_positions lpp
      JOIN liquidity_pools lp ON lpp.pool_id = lp.id
      JOIN cities c ON lp.city_id = c.id
      WHERE lpp.user_id = ${userId}
      ORDER BY lpp.updated_at DESC
    `;

    // Calculate current value and profit
    // Profit = currentValue - netDeposited
    // currentValue = shares * pricePerShare
    // pricePerShare = total_liquidity / total_shares
    // When pool gains liquidity (from trader losses or fees), pricePerShare increases
    // LP providers see profit proportional to their share ownership
    // NOTE: If user trades against their own pool and loses, they will see profit
    // from their own losses. This is correct behavior for liquidity pools.
    const enrichedPositions: UserLpPosition[] = positions.map(pos => {
      const currentValue = pos.shares * pos.pricePerShare;
      const netDeposited = pos.depositedAmount - pos.withdrawnAmount;
      const profit = currentValue - netDeposited;
      const profitPercent = netDeposited > 0 ? (profit / netDeposited) * 100 : 0;

      return {
        ...pos,
        currentValue,
        profit,
        profitPercent,
      };
    });

    return { positions: enrichedPositions };
  }
);
