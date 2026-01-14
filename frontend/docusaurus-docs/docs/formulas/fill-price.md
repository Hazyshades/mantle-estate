# Fill Price and Price Impact Calculation

Fill Price is the execution price of a trade that accounts for the trade's impact on the market (price impact).

## Fill Price Formula

$$\text{fillPrice} = \text{indexPrice} \times \left(1 + \frac{\text{skew} + \text{signedTradeSize}/2}{\text{SKEW\_SCALE}}\right)$$

where:

- $\text{signedTradeSize} = \text{tradeSize}$ for long positions
- $\text{signedTradeSize} = -\text{tradeSize}$ for short positions

## Parameters

| Parameter | Description |
|-----------|------------|
| `indexPrice` | Current Index Price |
| `skew` | Position imbalance: `Long OI - Short OI` |
| `tradeSize` | Trade size in USD: `amountUsd × leverage` |
| `SKEW_SCALE` | `10,000,000 USD` (scaling coefficient) |
| `direction` | Trade direction: `"long"` or `"short"` |

## Price Impact Formula

Price Impact shows how much the execution price differs from the Index Price:

$$\text{priceImpact} = \frac{\text{fillPrice} - \text{indexPrice}}{\text{indexPrice}}$$

## Explanation

### Average Price

Fill Price represents the average price between:
- Price before trade: $\text{indexPrice} \times \left(1 + \frac{\text{skew}}{\text{SKEW\_SCALE}}\right)$
- Price after trade: $\text{indexPrice} \times \left(1 + \frac{\text{skew} + \text{signedTradeSize}}{\text{SKEW\_SCALE}}\right)$

Simplified formula:

$$\text{fillPrice} = \text{indexPrice} \times \left(1 + \frac{\text{skew} + \text{signedTradeSize}/2}{\text{SKEW\_SCALE}}\right)$$

### Direction Impact

- **Long position**: `signedTradeSize > 0` → increases skew → raises price
- **Short position**: `signedTradeSize < 0` → decreases skew → lowers price

## Calculation Examples

### Example 1: Opening a long position

**Conditions:**
- Index Price = $300,000
- Long OI = $5,000,000
- Short OI = $3,000,000
- Trade Size = $100,000 (long)

**Calculation:**
```
skew = $5,000,000 - $3,000,000 = $2,000,000
signedTradeSize = $100,000
fillPrice = $300,000 × (1 + ($2,000,000 + $100,000/2) / $10,000,000)
         = $300,000 × (1 + $2,050,000 / $10,000,000)
         = $300,000 × (1 + 0.205)
         = $300,000 × 1.205
         = $361,500
```

**Price Impact:**
```
priceImpact = ($361,500 - $300,000) / $300,000 = 0.205 (20.5%)
```

### Example 2: Opening a short position

**Conditions:**
- Index Price = $300,000
- Long OI = $5,000,000
- Short OI = $3,000,000
- Trade Size = $100,000 (short)

**Calculation:**
```
skew = $5,000,000 - $3,000,000 = $2,000,000
signedTradeSize = -$100,000
fillPrice = $300,000 × (1 + ($2,000,000 - $100,000/2) / $10,000,000)
         = $300,000 × (1 + $1,950,000 / $10,000,000)
         = $300,000 × (1 + 0.195)
         = $300,000 × 1.195
         = $358,500
```

**Price Impact:**
```
priceImpact = ($358,500 - $300,000) / $300,000 = 0.195 (19.5%)
```

### Example 3: Small trade on a balanced market

**Conditions:**
- Index Price = $300,000
- Long OI = $5,000,000
- Short OI = $5,000,000
- Trade Size = $10,000 (long)

**Calculation:**
```
skew = $5,000,000 - $5,000,000 = $0
signedTradeSize = $10,000
fillPrice = $300,000 × (1 + ($0 + $10,000/2) / $10,000,000)
         = $300,000 × (1 + $5,000 / $10,000,000)
         = $300,000 × (1 + 0.0005)
         = $300,000 × 1.0005
         = $300,150
```

**Price Impact:**
```
priceImpact = ($300,150 - $300,000) / $300,000 = 0.0005 (0.05%)
```

## Important Notes

1. **Small trades**: For small trade sizes, price impact is minimal thanks to the large `SKEW_SCALE` value.

2. **Large trades**: For large trade sizes, price impact can be significant, reflecting the real market impact.

3. **Balancing**: Short positions on a market dominated by long positions will execute at a more favorable price, encouraging market balancing.
