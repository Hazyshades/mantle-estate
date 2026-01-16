<img width="1140" height="310" alt="image" src="https://github.com/user-attachments/assets/d8c9f302-b2c6-4c48-9326-b20b5dcc1a1f" />

A decentralized protocol for perpetual synthetic real estate trading on Mantle Network. Trade real estate price movements across global markets without owning physical property.

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
```
Index Price = Market Price × (1 + adjustment)
adjustment = clamp(skew / SKEW_SCALE, -MAX_PREMIUM, MAX_PREMIUM)
skew = Long OI - Short OI
```

### Fill Price
```
fillPrice = indexPrice × (1 + (skew + signedTradeSize/2) / SKEW_SCALE)
```

## Funding Rate

Funding rates balance positions by making the majority side pay the minority side.

```
new_funding_rate = current_funding_rate + Δ_rate
Δ_rate = normalized_skew × MAX_FUNDING_VELOCITY × days_elapsed
```

## Position Management

- **Fees**: 
  - Opening: 0.01% of position value
  - Closing: 0.01% of position value
  - Funding: Based on funding rate and time held


## Market Metrics

- Volume 24h
- Open Interest (Long OI + Short OI)
- Skew (Long OI - Short OI)
- Funding Rate
- Available OI

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Smart Contracts**: Solidity ^0.8.20 (Mantle Network)
- **Database**: PostgreSQL
- **Authentication**: Clerk


