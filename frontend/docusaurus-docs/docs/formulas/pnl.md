# Profit and Loss (P&L) Calculation

Profit and loss are calculated when closing a position based on the difference between entry price and exit price.

## Formulas

### For Long Position

```
grossPnl = (exitPrice - entryPrice) × quantity
netPnl = grossPnl - openingFee - closingFee
returnAmount = marginRequired + netPnl
```

### For Short Position

```
grossPnl = (entryPrice - exitPrice) × quantity
netPnl = grossPnl - openingFee - closingFee
returnAmount = marginRequired + netPnl
```

## Parameters

| Parameter | Description |
|----------|-------------|
| `entryPrice` | Entry price (Fill Price when opening) |
| `exitPrice` | Exit price (Index Price when closing) |
| `quantity` | Quantity in square meters (`quantity_sqm`) |
| `openingFee` | Opening fee: `positionValue × 0.001` |
| `closingFee` | Closing fee: `currentValue × 0.001` |
| `marginRequired` | Margin used when opening the position |
| `positionValue` | Position value when opening: `amountUsd × leverage` |
| `currentValue` | Current position value: `quantity × exitPrice` |

## Explanation

### Gross P&L

Gross P&L is profit/loss before fees:

**Long position:**
- If `exitPrice > entryPrice` → profit
- If `exitPrice < entryPrice` → loss

**Short position:**
- If `exitPrice < entryPrice` → profit
- If `exitPrice > entryPrice` → loss

### Net P&L

Net P&L is profit/loss after fees:

$$\text{netPnl} = \text{grossPnl} - \text{openingFee} - \text{closingFee}$$

### Return Amount

Return Amount is the amount returned to the trader's balance:

$$\text{returnAmount} = \text{marginRequired} + \text{netPnl}$$

If `netPnl > 0`, the trader receives more than invested. If `netPnl < 0`, the trader receives less.

## Calculation Examples

### Example 1: Profitable Long Position

**Opening conditions:**
- Amount USD = $10,000
- Leverage = 2x
- Entry Price = $300,000
- Quantity = 0.0667 sqm (calculated: $20,000 / $300,000)

**Closing conditions:**
- Exit Price = $315,000

**Calculation:**
```
positionValue = $10,000 × 2 = $20,000
openingFee = $20,000 × 0.001 = $20
currentValue = 0.0667 × $315,000 = $21,010.50
closingFee = $21,010.50 × 0.001 = $21.01

grossPnl = ($315,000 - $300,000) × 0.0667 = $1,000.50
netPnl = $1,000.50 - $20 - $21.01 = $959.49
returnAmount = $10,000 + $959.49 = $10,959.49
```

### Example 2: Losing Long Position

**Opening conditions:**
- Amount USD = $10,000
- Leverage = 2x
- Entry Price = $300,000
- Quantity = 0.0667 sqm

**Closing conditions:**
- Exit Price = $285,000

**Calculation:**
```
positionValue = $10,000 × 2 = $20,000
openingFee = $20,000 × 0.001 = $20
currentValue = 0.0667 × $285,000 = $19,009.50
closingFee = $19,009.50 × 0.001 = $19.01

grossPnl = ($285,000 - $300,000) × 0.0667 = -$1,000.50
netPnl = -$1,000.50 - $20 - $19.01 = -$1,039.51
returnAmount = $10,000 - $1,039.51 = $8,960.49
```

### Example 3: Profitable Short Position

**Opening conditions:**
- Amount USD = $10,000
- Leverage = 1x
- Entry Price = $300,000
- Quantity = 0.0333 sqm (calculated: $10,000 / $300,000)

**Closing conditions:**
- Exit Price = $285,000

**Calculation:**
```
positionValue = $10,000 × 1 = $10,000
openingFee = $10,000 × 0.001 = $10
currentValue = 0.0333 × $285,000 = $9,490.50
closingFee = $9,490.50 × 0.001 = $9.49

grossPnl = ($300,000 - $285,000) × 0.0333 = $499.50
netPnl = $499.50 - $10 - $9.49 = $480.01
returnAmount = $10,000 + $480.01 = $10,480.01
```

## Leverage Impact

Leverage increases both potential profit and potential loss:

- **Without leverage (1x)**: 5% price change → 5% P&L change
- **With leverage (2x)**: 5% price change → 10% P&L change

### Leverage Example

**Conditions:**
- Amount USD = $10,000
- Leverage = 2x
- Entry Price = $300,000
- Exit Price = $315,000 (5% increase)

**Without leverage (1x):**
```
positionValue = $10,000
quantity = $10,000 / $300,000 = 0.0333 sqm
grossPnl = ($315,000 - $300,000) × 0.0333 = $500
```

**With leverage (2x):**
```
positionValue = $20,000
quantity = $20,000 / $300,000 = 0.0667 sqm
grossPnl = ($315,000 - $300,000) × 0.0667 = $1,000
```

P&L doubles when using 2x leverage.
