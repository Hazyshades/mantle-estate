# Market Metrics

Market Metrics provide key indicators about the state of each real estate market in Mantle Estate.

## Core Metrics

### 1. Open Interest (OI)

**Definition**: Total value of all open positions in a market.

**Formula:**
```
totalOI = totalLongValue + totalShortValue
```

where:
- `totalLongValue = Σ(quantity_sqm_i × entry_price_i)` for all long positions
- `totalShortValue = Σ(quantity_sqm_i × entry_price_i)` for all short positions

**Significance:**
- Higher OI → more liquidity → less price impact
- Lower OI → less liquidity → more price impact

### 2. Volume 24h

**Definition**: Total trading volume (in USD) over the last 24 hours.

**Calculation:**
```
volume24h = Σ(quantity × price) for all transactions in last 24 hours
```

**Significance:**
- High volume → active market
- Low volume → quiet market

### 3. Skew

**Definition**: Difference between total long and short position values.

**Formula:**
```
skew = totalLongValue - totalShortValue
```

**Interpretation:**
- **Positive skew** → more long positions → Index Price above Market Price (up to +5%)
- **Negative skew** → more short positions → Index Price below Market Price (down to -5%)
- **Zero skew** → balanced positions → Index Price = Market Price

**Significance:**
- Skew affects Index Price calculation
- Skew affects Funding Rate direction
- Large skew indicates market sentiment

### 4. Long/Short Ratio

**Definition**: Ratio of long to short position values.

**Formula:**
```
longShortRatio = totalLongValue / totalShortValue
```

**Interpretation:**
- **Ratio > 1** → more longs than shorts
- **Ratio < 1** → more shorts than longs
- **Ratio = 1** → balanced market

### 5. Total Long Value

**Definition**: Total USD value of all open long positions.

```
totalLongValue = Σ(quantity_sqm_i × entry_price_i) for all long positions
```

### 6. Total Short Value

**Definition**: Total USD value of all open short positions.

```
totalShortValue = Σ(quantity_sqm_i × entry_price_i) for all short positions
```

## Market Price Metrics

### Market Price

**Definition**: Real-world price of real estate, sourced from external data providers.

**Update Frequency**: Daily

**Sources:**
- **US Markets**: Zillow
- **European Markets**: Official government indices (Land Registry, INSEE, Destatis, etc.)
- **APAC Markets**: Official indices (JREI, URA, NBS, etc.)

### Index Price

**Definition**: Trading price that accounts for position imbalance.

**Formula**: See [Index Price Calculation](/formulas/index-price-calculation)

**Update Frequency**: Continuously (on each trade)

### Price Premium/Discount

**Definition**: Percentage difference between Index Price and Market Price.

**Formula:**
```
premium = (indexPrice - marketPrice) / marketPrice × 100%
```

**Range**: -5% to +5% (limited by MAX_PREMIUM)

## Funding Metrics

### Funding Rate

**Definition**: Rate paid or received based on position imbalance.

**Formula**: See [Funding Rate Calculation](/formulas/funding-rate-calculation)

**Update Frequency**: Daily

**Direction:**
- **Positive** → Longs pay Shorts
- **Negative** → Shorts pay Longs

### Funding Velocity

**Definition**: Rate of change of Funding Rate.

**Maximum**: ±1% per day (MAX_FUNDING_VELOCITY)

## Position Metrics

### Number of Open Positions

**Definition**: Count of all open positions in the market.

```
positionCount = count(open positions)
```

### Average Position Size

**Definition**: Average USD value of open positions.

```
averagePositionSize = totalOI / positionCount
```

### Largest Position

**Definition**: Largest open position value in USD.

## Price History Metrics

### 24h Price Change

**Definition**: Percentage change in Market Price over last 24 hours.

```
priceChange24h = (currentPrice - price24hAgo) / price24hAgo × 100%
```

### 7d Price Change

**Definition**: Percentage change in Market Price over last 7 days.

### 30d Price Change

**Definition**: Percentage change in Market Price over last 30 days.

## Market Health Indicators

### 1. Liquidity Score

**Qualitative assessment based on:**
- Open Interest (higher = better)
- Trading Volume (higher = better)
- Price Impact (lower = better)

### 2. Market Balance

**Assessment:**
- **Balanced**: |skew| < $1M → minimal price premium
- **Imbalanced**: |skew| > $5M → significant price premium
- **Extreme**: |skew| > $10M → maximum price premium (±5%)

### 3. Trading Activity

**Assessment:**
- **Active**: High volume, frequent trades
- **Moderate**: Medium volume, regular trades
- **Quiet**: Low volume, infrequent trades

## Example Market Metrics

```
Market: London
- Market Price: $650,000
- Index Price: $662,500 (+1.92% premium)
- Funding Rate: 0.0008 (0.08% per day, Longs pay)
- Open Interest: $12,500,000
- Total Long Value: $8,750,000
- Total Short Value: $3,750,000
- Skew: $5,000,000
- Long/Short Ratio: 2.33
- Volume 24h: $1,250,000
- Positions: 45
- Average Position Size: $277,778
- 24h Price Change: +0.5%
- 7d Price Change: +2.1%
```

## Using Market Metrics

### For Traders

- **High OI** → Better execution, lower slippage
- **Low Skew** → Market price more accurate, lower funding costs
- **High Volume** → More active market, easier to enter/exit

### For Risk Assessment

- **Extreme Skew** → Potential for price correction
- **Low Volume** → Higher price impact risk
- **Funding Rate** → Consider cost of holding position

### For Market Analysis

- **Skew Direction** → Market sentiment (bullish/bearish)
- **OI Growth** → Market adoption
- **Price Trends** → Historical performance

