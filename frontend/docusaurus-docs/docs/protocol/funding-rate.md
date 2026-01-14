# Funding Rate

Funding Rate is a mechanism that balances long and short positions in the market, ensuring equilibrium between buyers and sellers.

## What is Funding Rate?

Funding Rate is a rate that is charged or paid between market participants depending on position imbalance:

- **Positive rate** → Long positions pay Short positions
- **Negative rate** → Short positions pay Long positions

## Why Funding Rate?

1. **Market Balancing**: The rate incentivizes participants to open positions in the direction of the minority
2. **Risk Compensation**: The side with fewer positions receives compensation for risk
3. **Synchronization**: Index price approaches market price

## How is Funding Rate Calculated?

Funding Rate is updated daily and calculated based on:

### 1. Skew (Position Imbalance)

```
skew = totalLongValue - totalShortValue
```

where:
- `totalLongValue` — total value of all open long positions
- `totalShortValue` — total value of all open short positions

### 2. Normalizing Skew

```
normalizedSkew = max(-1, min(1, skew / SKEW_SCALE))
```

where `SKEW_SCALE = 10,000,000 USD` — scaling coefficient for smooth changes

### 3. Rate Change

The rate changes proportionally to imbalance and time:

```
deltaRate = normalizedSkew × MAX_FUNDING_VELOCITY × daysElapsed
```

where:
- `MAX_FUNDING_VELOCITY = 0.01` (1% per day) — maximum rate change velocity
- `daysElapsed` — number of days since last update

### 4. New Rate

```
newRate = currentRate + deltaRate
```

### 5. Decay

If positions are balanced (`|normalizedSkew| < 0.0001`), the rate decays toward zero:

```
decayRate = |currentRate| > 0.0001 ? 0.5 : 0.1
decayFactor = decayRate ^ daysElapsed
newRate = newRate × decayFactor
```

## Special Cases

### No Open Positions

If `totalOI = 0` (no open positions), then `fundingRate = 0`

### Balanced Market

If long and short positions are approximately equal, the rate decays toward zero

## Examples

### Example 1: More Long Positions

- Long positions: $15,000,000
- Short positions: $5,000,000
- Skew: $10,000,000
- Normalized Skew: 1.0 (maximum)
- Rate change: +1% per day

**Result**: Longs pay Shorts

### Example 2: More Short Positions

- Long positions: $5,000,000
- Short positions: $15,000,000
- Skew: -$10,000,000
- Normalized Skew: -1.0 (minimum)
- Rate change: -1% per day

**Result**: Shorts pay Longs

### Example 3: Balanced Market

- Long positions: $10,000,000
- Short positions: $10,000,000
- Skew: $0
- Normalized Skew: 0

**Result**: Rate decays toward zero

## How is Funding Paid?

Funding fee is calculated as follows:

```
Funding Fee = Position Size × Funding Rate × Days Held
```

where:
- **Position Size** = `quantity_sqm × current_price` (position size in USD)
- **Funding Rate** — current funding rate
- **Days Held** — number of days the position was open

### Payment Direction

- **Long position**:
  - If `fundingRate > 0` → pays (negative fee)
  - If `fundingRate < 0` → receives (positive fee)

- **Short position**:
  - If `fundingRate > 0` → receives (positive fee)
  - If `fundingRate < 0` → pays (negative fee)

## Update Frequency

Funding Rate is updated:
- **Daily** during price updates
- On each position open/close (recalculation based on new metrics)

## Important Notes

1. **Maximum change velocity**: 1% per day (to prevent sharp spikes)
2. **Smoothness**: Large `SKEW_SCALE` ensures smooth rate changes
3. **Automatic balancing**: Mechanism automatically incentivizes market balance



