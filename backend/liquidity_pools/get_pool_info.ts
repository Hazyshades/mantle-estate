import { api } from "encore.dev/api";
import db from "../db";

interface GetPoolInfoRequest {
  cityId: number;
}

interface GetPoolInfoResponse {
  poolId: number;
  cityId: number;
  cityName: string;
  totalLiquidity: number;
  totalShares: number;
  pricePerShare: number;
  cumulativePnl: number;
  totalFeesCollected: number;
}

export const getPoolInfo = api<GetPoolInfoRequest, GetPoolInfoResponse>(
  { auth: false, expose: true, method: "GET", path: "/liquidity-pools/info/:cityId" },
  async ({ cityId }) => {
    const pool = await db.queryRow<{
      id: number;
      cityId: number;
      cityName: string;
      totalLiquidity: number;
      totalShares: number;
      cumulativePnl: number;
      totalFeesCollected: number;
    }>`
      SELECT 
        lp.id, lp.city_id as "cityId", c.name as "cityName",
        lp.total_liquidity as "totalLiquidity",
        lp.total_shares as "totalShares",
        lp.cumulative_pnl as "cumulativePnl",
        lp.total_fees_collected as "totalFeesCollected"
      FROM liquidity_pools lp
      JOIN cities c ON lp.city_id = c.id
      WHERE lp.city_id = ${cityId}
    `;

    if (!pool) {
      return {
        poolId: 0,
        cityId,
        cityName: "",
        totalLiquidity: 0,
        totalShares: 0,
        pricePerShare: 1.0,
        cumulativePnl: 0,
        totalFeesCollected: 0,
      };
    }

    const pricePerShare = pool.totalShares > 0 
      ? pool.totalLiquidity / pool.totalShares 
      : 1.0;

    return {
      poolId: pool.id,
      cityId: pool.cityId,
      cityName: pool.cityName,
      totalLiquidity: pool.totalLiquidity,
      totalShares: pool.totalShares,
      pricePerShare,
      cumulativePnl: pool.cumulativePnl,
      totalFeesCollected: pool.totalFeesCollected,
    };
  }
);
