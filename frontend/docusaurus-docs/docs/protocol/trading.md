# Trading

The protocol supports trading perpetual contracts on synthetic real estate with leverage.

## Position Types

### Long Position

A long position is opened when a trader expects the real estate price to rise. When the price increases, the trader makes a profit.

### Short Position

A short position is opened when a trader expects the real estate price to fall. When the price decreases, the trader makes a profit.

## Leverage

The protocol supports leverage up to **2x**:
- **1x** — no leverage (margin trading)
- **2x** — double leverage

When using leverage, a trader can open a position of greater value using a smaller margin amount.

## Fill Price

When opening a position, **Fill Price** is used, which accounts for the trade's impact on the market (price impact).

Fill Price is calculated based on the current Index Price and trade size:

$$\text{fillPrice} = \text{indexPrice} \times \left(1 + \frac{\text{skew} + \text{signedTradeSize}/2}{\text{SKEW\_SCALE}}\right)$$

where:
- $\text{signedTradeSize} = \text{tradeSize}$ for long positions
- $\text{signedTradeSize} = -\text{tradeSize}$ for short positions

### Price Impact

Price Impact shows how much the execution price differs from the Index Price:

$$\text{priceImpact} = \frac{\text{fillPrice} - \text{indexPrice}}{\text{indexPrice}}$$

## Fees

The protocol charges a fee of **0.1%** (0.001) when:
- Opening a position (opening fee)
- Closing a position (closing fee)

The fee is calculated from the position value:
- Opening fee = $\text{positionValue} \times 0.001$
- Closing fee = $\text{currentValue} \times 0.001$

## Profit and Loss Calculation

Profit/loss is calculated when closing a position:

**For Long Position:**

$$\text{grossPnl} = (\text{exitPrice} - \text{entryPrice}) \times \text{quantity}$$

$$\text{netPnl} = \text{grossPnl} - \text{openingFee} - \text{closingFee}$$

**For Short Position:**

$$\text{grossPnl} = (\text{entryPrice} - \text{exitPrice}) \times \text{quantity}$$

$$\text{netPnl} = \text{grossPnl} - \text{openingFee} - \text{closingFee}$$
