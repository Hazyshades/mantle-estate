# Funding Rate Calculation

Funding Rate is a financing rate that compensates for the imbalance between long and short positions in the market.

## Formula

$$\text{new\_funding\_rate} = \text{current\_funding\_rate} + \text{delta\_rate}$$

where:

$$\text{delta\_rate} = \text{normalized\_skew} \times \text{MAX\_FUNDING\_VELOCITY} \times \text{days\_elapsed}$$

and:

$$\text{normalized\_skew} = \text{clamp}\left(\frac{\text{skew}}{\text{SKEW\_SCALE}}, -1, 1\right)$$

## Parameters

| Parameter | Value | Description |
|-----------|-------|-------------|
| `current_funding_rate` | Variable | Current funding rate |
| `skew` | `Long OI - Short OI` | Position imbalance in USD |
| `SKEW_SCALE` | `10,000,000 USD` | Scaling coefficient |
| `MAX_FUNDING_VELOCITY` | `0.01` (1% per day) | Maximum rate of change for funding rate |
| `days_elapsed` | Variable | Number of days since last update |

## Explanation

### Normalized Skew

Normalized skew limits the impact of large imbalances:

$$\text{normalized\_skew} = \text{clamp}\left(\frac{\text{skew}}{\text{SKEW\_SCALE}}, -1, 1\right)$$

This means:
- If $\text{skew} > \text{SKEW\_SCALE}$, then $\text{normalized\_skew} = 1$
- If $\text{skew} < -\text{SKEW\_SCALE}$, then $\text{normalized\_skew} = -1$
- Otherwise $\text{normalized\_skew} = \frac{\text{skew}}{\text{SKEW\_SCALE}}$

### Delta Rate

Delta rate shows the change in funding rate over a period:

$$\text{delta\_rate} = \text{normalized\_skew} \times \text{MAX\_FUNDING\_VELOCITY} \times \text{days\_elapsed}$$

The maximum change per day is 1% ($\text{MAX\_FUNDING\_VELOCITY}$).

### New Funding Rate

The new funding rate is calculated as the sum of the current rate and the change:

$$\text{new\_funding\_rate} = \text{current\_funding\_rate} + \text{delta\_rate}$$

## Calculation Examples

### Example 1: Long position dominance

**Conditions:**
- Current Funding Rate = 0.02 (2%)
- Long OI = $8,000,000
- Short OI = $3,000,000
- 1 day elapsed

**Calculation:**

```
skew = $8,000,000 - $3,000,000 = $5,000,000
normalized_skew = $5,000,000 / $10,000,000 = 0.5
delta_rate = 0.5 × 0.01 × 1 = 0.005
new_funding_rate = 0.02 + 0.005 = 0.025 (2.5%)
```

### Example 2: Short position dominance

**Conditions:**
- Current Funding Rate = 0.01 (1%)
- Long OI = $2,000,000
- Short OI = $7,000,000
- 2 days elapsed

**Calculation:**

```
skew = $2,000,000 - $7,000,000 = -$5,000,000
normalized_skew = -$5,000,000 / $10,000,000 = -0.5
delta_rate = -0.5 × 0.01 × 2 = -0.01
new_funding_rate = 0.01 - 0.01 = 0.0 (0%)
```

### Example 3: Maximum imbalance

**Conditions:**
- Current Funding Rate = 0.0 (0%)
- Long OI = $15,000,000
- Short OI = $1,000,000
- 1 day elapsed

**Calculation:**

```
skew = $15,000,000 - $1,000,000 = $14,000,000
normalized_skew = clamp($14,000,000 / $10,000,000, -1, 1) = 1.0
delta_rate = 1.0 × 0.01 × 1 = 0.01
new_funding_rate = 0.0 + 0.01 = 0.01 (1%)
```

## Interpretation

- **Positive Funding Rate**: more long positions в†’ traders with long positions pay funding to traders with short positions
- **Negative Funding Rate**: more short positions в†’ traders with short positions pay funding to traders with long positions
- **Zero Funding Rate**: balance between long and short positions

## Update

Funding Rate is updated:
- When opening/closing positions
- Daily as part of periodic updates
