<img width="1140" height="310" alt="image" src="https://github.com/user-attachments/assets/d8c9f302-b2c6-4c48-9326-b20b5dcc1a1f" />

A decentralized protocol for perpetual synthetic real estate trading on Mantle Network. Trade real estate price movements across global markets without owning physical property.

Disclaimer:
We are still in testnet mode and actively testing best practices and mechanics.

# Site
https://mantle-estate-frontend.vercel.app

# A blog about the main functions 
https://mantle-estate-frontend.vercel.app/blog/mantle-estate-v0.1

# Full documentation
https://mantle-estate-frontend.vercel.app/docs/intro/

## Overview

Mantle Estate combines perpetual futures markets and synthetic asset protocols to enable efficient real estate exposure trading. The protocol uses a two-tier pricing system:
- **Market Price**: Oracle-based prices from external data sources (Zillow ZHVI for US, official indices for Europe/APAC)
- **Index Price**: Dynamic pricing that adjusts based on position imbalances (max 5% deviation from Market Price)

## Pricing Model

### Index Price

$$\text{Index Price} = \text{Market Price} \times (1 + \text{adjustment})$$

where:

$$\text{adjustment} = \text{clamp}\left(\frac{\text{skew}}{\text{SKEW SCALE}}, -\text{MAX PREMIUM}, \text{MAX PREMIUM}\right)$$

$$\text{skew} = \text{Long OI} - \text{Short OI}$$

**Parameters:**
- `SKEW_SCALE` = 10,000,000 USD
- `MAX_PREMIUM` = 0.05 (5%)

### Fill Price

$$\text{fillPrice} = \text{indexPrice} \times \left(1 + \frac{\text{skew} + \text{signedTradeSize}/2}{\text{SKEW SCALE}}\right)$$

where $\text{signedTradeSize} = \text{tradeSize}$ (if long) or $-\text{tradeSize}$ (if short)

## Funding Rate

Funding rates balance positions by making the majority side pay the minority side.

$$\text{new funding rate} = \text{current funding rate} + \Delta_{rate}$$

where:

$$\Delta_{rate} = \text{normalized skew} \times \text{MAX FUNDING VELOCITY} \times \text{days elapsed}$$

$$\text{normalized skew} = \text{clamp}\left(\frac{\text{skew}}{\text{SKEW SCALE}}, -1, 1\right)$$

$$\text{skew} = \text{Long OI} - \text{Short OI}$$

**Parameters:**
- `MAX_FUNDING_VELOCITY` = 0.01 (1% per day)
- Funding fee: $\text{Funding Fee} = \text{Position Size} \times \text{Funding Rate} \times \text{Days Held}$

## Position Management

### Fees
- Opening/Closing: 0.01% of position value

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Smart Contracts**: Solidity ^0.8.20 (Mantle Network)
- **Database**: PostgreSQL
- **Authentication**: Clerk
