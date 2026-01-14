# Index Price Calculation

Index Price is the execution price used for opening and closing positions. It is calculated based on Market Price and the current position imbalance in the market.

## Formula

$$\text{Index Price} = \text{Market Price} \times (1 + \text{adjustment})$$

where:

$$\text{adjustment} = \text{clamp}\left(\frac{\text{skew}}{\text{SKEW\_SCALE}}, -\text{MAX\_PREMIUM}, \text{MAX\_PREMIUM}\right)$$

## Parameters

| Parameter | Value | Description |
|-----------|-------|-------------|
| `Market Price` | Variable | Base real estate price from external sources |
| `skew` | `Long OI - Short OI` | Position imbalance in USD |
| `SKEW_SCALE` | `10,000,000 USD` | Scaling coefficient for smooth price changes |
| `MAX_PREMIUM` | `0.05` (5%) | Maximum deviation of Index Price from Market Price |

## Explanation

### Skew

Skew (imbalance) is calculated as the difference between the total value of long and short positions:

$$\text{skew} = \text{totalLongValue} - \text{totalShortValue}$$

where:
- $\text{totalLongValue} = \sum(\text{quantity\_sqm} \times \text{entry\_price})$ for all long positions
- $\text{totalShortValue} = \sum(\text{quantity\_sqm} \times \text{entry\_price})$ for all short positions

### Adjustment

Adjustment shows how much Index Price deviates from Market Price:

$$\text{adjustment} = \frac{\text{skew}}{\text{SKEW\_SCALE}}$$

Adjustment is limited to the range `[-MAX_PREMIUM, MAX_PREMIUM]`, meaning Index Price cannot deviate from Market Price by more than 5%.

### SKEW_SCALE

SKEW_SCALE is chosen such that the change in Index Price for a $100 purchase is less than $0.01:

$$\text{change} = \text{indexPrice} \times \frac{\text{skew}}{\text{SKEW\_SCALE}}$$

With $\text{indexPrice} \approx 334{,}511$, $\text{skew} = 100$, $\text{change} < 0.01$:

$$\text{SKEW\_SCALE} > \frac{334{,}511 \times 100}{0.01} = 3{,}345{,}110{,}000$$

A more conservative value of $10{,}000{,}000$ is used to ensure smooth price changes.

## Calculation Examples

### Example 1: Balanced market

**Conditions:**
- Market Price = $300,000
- Long OI = $5,000,000
- Short OI = $5,000,000

**Calculation:**

```
skew = $5,000,000 - $5,000,000 = $0
adjustment = $0 / $10,000,000 = 0
Index Price = $300,000 × (1 + 0) = $300,000
```

### Example 2: Long position dominance

**Conditions:**
- Market Price = $300,000
- Long OI = $8,000,000
- Short OI = $3,000,000

**Calculation:**

```
skew = $8,000,000 - $3,000,000 = $5,000,000
adjustment = $5,000,000 / $10,000,000 = 0.5
clamped_adjustment = min(0.5, 0.05) = 0.05
Index Price = $300,000 × (1 + 0.05) = $315,000
```

### Example 3: Short position dominance

**Conditions:**
- Market Price = $300,000
- Long OI = $2,000,000
- Short OI = $7,000,000

**Calculation:**

```
skew = $2,000,000 - $7,000,000 = -$5,000,000
adjustment = -$5,000,000 / $10,000,000 = -0.5
clamped_adjustment = max(-0.5, -0.05) = -0.05
Index Price = $300,000 × (1 - 0.05) = $285,000
```

## Update

Index Price is automatically updated when:
- Opening a new position
- Closing an existing position
- Periodic update (daily)
