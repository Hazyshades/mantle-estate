// Constants for calculation
const MAX_PREMIUM = 0.05; // Maximum premium 5%
const LIQUIDITY_THRESHOLD = 1000000; // Liquidity threshold in USD
// SkewScale should be large enough so that Index Price change when buying $100 is < 0.01 USD
// Formula: change = indexPrice × (skew / skewScale)
// At indexPrice ≈ 334511, skew = 100, change < 0.01:
// skewScale > 334511 × 100 / 0.01 = 3,345,110,000
// Use more conservative value for smooth change
const SKEW_SCALE = 10000000; // 10M USD - ensures very smooth Index Price change
const MAX_FUNDING_VELOCITY = 0.01; // Maximum funding rate change velocity (1% per day)

// Price update schedule: every 6 hours at the start of the hour (0:00, 6:00, 12:00, 18:00 UTC)
export const PRICE_UPDATE_CRON_SCHEDULE = "0 */6 * * *";
export const PRICE_UPDATE_INTERVAL_HOURS = 6;
export const PRICE_UPDATE_HOURS = [0, 6, 12, 18]; // UTC hours when updates occur

export interface MarketMetrics {
  totalLongValue: number;
  totalShortValue: number;
  totalOI: number;
  volume24h: number;
}

/**
 * Calculate Index Price based on Market Price and trading metrics
 * Index Price changes very smoothly based on skew
 */
export function calculateIndexPrice(
  marketPrice: number,
  metrics: MarketMetrics
): number {
  const { totalLongValue, totalShortValue } = metrics;
  
  // Calculate skew (difference between Long and Short positions)
  const skew = totalLongValue - totalShortValue;
  
  // Index Price changes very smoothly based on skew
  // Formula: Index Price = Market Price × (1 + skew / skewScale)
  // This gives very small change at small skew
  const priceAdjustment = skew / SKEW_SCALE;
  
  // Limit change to maximum premium (5%)
  const clampedAdjustment = Math.max(-MAX_PREMIUM, Math.min(MAX_PREMIUM, priceAdjustment));
  
  // Index Price = Market Price × (1 + adjustment)
  return marketPrice * (1 + clampedAdjustment);
}

/**
 * Calculate Funding Rate
 */
export function calculateFundingRate(
  currentRate: number,
  metrics: MarketMetrics,
  daysElapsed: number
): number {
  const { totalLongValue, totalShortValue, totalOI } = metrics;
  
  // If there are no open positions, funding rate should be 0
  if (totalOI === 0) {
    return 0;
  }
  
  const skew = totalLongValue - totalShortValue;
  
  // Normalize skew
  const normalizedSkew = Math.max(-1, Math.min(1, skew / SKEW_SCALE));
  
  // Calculate rate change based on skew
  const deltaRate = normalizedSkew * MAX_FUNDING_VELOCITY * daysElapsed;
  
  // New funding rate
  const newRate = currentRate + deltaRate;
  
  // If skew is zero (balanced positions), funding rate should decay towards 0
  if (Math.abs(normalizedSkew) < 0.0001) {
    // Decay towards 0 when positions are balanced
    // Use faster decay when rate is small to avoid lingering near zero
    const decayRate = Math.abs(currentRate) > 0.0001 ? 0.5 : 0.1; // Faster decay for small rates
    const decayFactor = Math.pow(decayRate, daysElapsed);
    return newRate * decayFactor;
  }
  
  return newRate;
}

/**
 * Calculate Fill Price for trade
 * Formula: fillPrice = (indexPrice * (1 + skew/skewScale) + indexPrice * (1 + (skew + tradeSize)/skewScale)) / 2
 * Simplified: fillPrice = indexPrice * (1 + (skew + tradeSize/2) / skewScale)
 * 
 * Returns fillPrice and priceImpact (change relative to indexPrice)
 */
export function calculateFillPrice(
  indexPrice: number,
  currentSkew: number,
  tradeSize: number,
  direction: "long" | "short"
): { fillPrice: number; priceImpact: number } {
  // Sign of tradeSize depends on direction
  const signedTradeSize = direction === "long" ? tradeSize : -tradeSize;
  
  // Calculate fillPrice
  // fillPrice = indexPrice * (1 + (skew + tradeSize/2) / skewScale)
  const fillPrice = indexPrice * (1 + (currentSkew + signedTradeSize / 2) / SKEW_SCALE);
  
  // Price Impact = (fillPrice - indexPrice) / indexPrice
  const priceImpact = (fillPrice - indexPrice) / indexPrice;
  
  return { fillPrice, priceImpact };
}

/**
 * Calculate Price Impact for trade (for backward compatibility)
 * @deprecated Use calculateFillPrice instead
 */
export function calculatePriceImpact(
  tradeSize: number,
  totalOI: number,
  direction: "long" | "short"
): number {
  // For backward compatibility use simplified formula
  // But this should not be used for fillPrice calculation
  if (totalOI === 0) return 0;
  
  // Simplified formula: impact = tradeSize / (2 * skewScale)
  // This gives very small change at small tradeSize
  const impact = tradeSize / (2 * SKEW_SCALE);
  return direction === "long" ? impact : -impact;
}

/**
 * Get market metrics for city
 * @param cityId - City ID
 * @param db - SQLDatabase or transaction from Encore (supports queryAll and queryRow)
 */
export async function getMarketMetrics(
  cityId: number, 
  db: { queryAll: typeof import("../db").default.queryAll; queryRow: typeof import("../db").default.queryRow }
): Promise<MarketMetrics> {
  // Get all open positions for city
  const positions = await db.queryAll<{
    position_type: string;
    quantity_sqm: number;
    entry_price: number;
  }>`
    SELECT position_type, quantity_sqm, entry_price
    FROM positions
    WHERE city_id = ${cityId} AND closed_at IS NULL
  `;
  
  let totalLongValue = 0;
  let totalShortValue = 0;
  
  for (const pos of positions) {
    const value = pos.quantity_sqm * pos.entry_price;
    if (pos.position_type === "long") {
      totalLongValue += value;
    } else {
      totalShortValue += value;
    }
  }
  
  const totalOI = totalLongValue + totalShortValue;
  
  // Get trading volume for 24 hours
  // Use JavaScript Date for consistency with other queries
  const cutoff24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const volume24h = await db.queryRow<{ volume: number }>`
    SELECT COALESCE(SUM(quantity * price), 0) as volume
    FROM transactions
    WHERE city_id = ${cityId}
      AND timestamp >= ${cutoff24h}
  `;
  
  return {
    totalLongValue,
    totalShortValue,
    totalOI,
    volume24h: volume24h?.volume || 0,
  };
}





