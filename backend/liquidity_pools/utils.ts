import db from "../db";

export interface PoolInfo {
  id: number;
  cityId: number;
  totalLiquidity: number;
  totalShares: number;
  pricePerShare: number;
  cumulativePnl: number;
  totalFeesCollected: number;
}

type DatabaseExecutor = typeof db | Awaited<ReturnType<typeof db.begin>>;

/**
 * Get or create pool for a city
 */
export async function getOrCreatePool(cityId: number, tx?: DatabaseExecutor): Promise<PoolInfo> {
  let pool: PoolInfo | null = null;
  
  if (tx) {
    pool = await tx.queryRow<PoolInfo>`
      SELECT id, city_id as "cityId", total_liquidity as "totalLiquidity",
             total_shares as "totalShares", cumulative_pnl as "cumulativePnl",
             total_fees_collected as "totalFeesCollected"
      FROM liquidity_pools
      WHERE city_id = ${cityId}
    `;

    if (!pool) {
      const newPool = await tx.queryRow<{ id: number }>`
        INSERT INTO liquidity_pools (city_id, total_liquidity, total_shares)
        VALUES (${cityId}, 0.0, 0.0)
        RETURNING id
      `;
      
      pool = await tx.queryRow<PoolInfo>`
        SELECT id, city_id as "cityId", total_liquidity as "totalLiquidity",
               total_shares as "totalShares", cumulative_pnl as "cumulativePnl",
               total_fees_collected as "totalFeesCollected"
        FROM liquidity_pools
        WHERE id = ${newPool.id}
      `;
    }
  } else {
    pool = await db.queryRow<PoolInfo>`
      SELECT id, city_id as "cityId", total_liquidity as "totalLiquidity",
             total_shares as "totalShares", cumulative_pnl as "cumulativePnl",
             total_fees_collected as "totalFeesCollected"
      FROM liquidity_pools
      WHERE city_id = ${cityId}
    `;

    if (!pool) {
      const newPool = await db.queryRow<{ id: number }>`
        INSERT INTO liquidity_pools (city_id, total_liquidity, total_shares)
        VALUES (${cityId}, 0.0, 0.0)
        RETURNING id
      `;
      
      pool = await db.queryRow<PoolInfo>`
        SELECT id, city_id as "cityId", total_liquidity as "totalLiquidity",
               total_shares as "totalShares", cumulative_pnl as "cumulativePnl",
               total_fees_collected as "totalFeesCollected"
        FROM liquidity_pools
        WHERE id = ${newPool.id}
      `;
    }
  }

  const pricePerShare = pool.totalShares > 0 
    ? pool.totalLiquidity / pool.totalShares 
    : 1.0;

  return {
    ...pool,
    pricePerShare,
  };
}

/**
 * Calculate shares to mint for deposit
 * In MVP: proportional to current share price
 */
export function calculateSharesToMint(
  depositAmount: number,
  totalLiquidity: number,
  totalShares: number
): number {
  if (totalShares === 0 || totalLiquidity === 0) {
    // First deposit: 1 share = 1 USDC
    return depositAmount;
  }
  
  // Proportional share minting at current price
  const currentPricePerShare = totalLiquidity / totalShares;
  return depositAmount / currentPricePerShare;
}

/**
 * Calculate USDC amount for withdrawal
 * In MVP: at current share price
 */
export function calculateWithdrawAmount(
  sharesToBurn: number,
  totalLiquidity: number,
  totalShares: number
): number {
  if (totalShares === 0) {
    return 0;
  }
  
  const currentPricePerShare = totalLiquidity / totalShares;
  return sharesToBurn * currentPricePerShare;
}
