# Protocol Overview

Mantle Estate is a protocol for decentralized trading of synthetic real estate on the Mantle Network.

## Protocol Architecture

The protocol consists of the following main components:

### 1. Smart Contracts
- **MantleEstateDeposit** — Contract for deposits and withdrawals
- Works with USDC (USD Coin) on the Mantle Network

### 2. Backend (Encore.dev)
- API for trading, position management, and price calculations
- Price and funding rate updates
- User balance management

### 3. Frontend (React)
- Web interface for interacting with the protocol
- View markets, open/close positions
- Track positions and transaction history

## Key Mechanisms

### Price Discovery

The protocol uses a two-tier pricing system:

1. **Market Price** — Reflects the real-world market value of real estate
   - Updated daily based on external data sources
   - For US: Zillow
   - For Europe and APAC: Official indices and market reports

2. **Index Price** — Trading price that accounts for position imbalance
   - Calculated based on Market Price and skew (difference between long and short positions)
   - Changes smoothly depending on imbalance

### Trading

Users can:
- Open long positions (betting on price increases)
- Open short positions (betting on price decreases)
- Use leverage (1x or 2x)
- Close positions at any time

### Funding Rate

The funding rate:
- Automatically adjusts based on position imbalance
- If more long positions → positive rate → longs pay shorts
- If more short positions → negative rate → shorts pay longs
- Updated daily

### Market Metrics

The protocol tracks:
- **Open Interest (OI)** — Total value of all open positions
- **Volume 24h** — Trading volume over the last 24 hours
- **Skew** — Difference between long and short position values
- **Long/Short Ratio** — Ratio of long to short positions

## Security

- Authentication via Clerk
- Transactions through smart contracts on Mantle
- Parameterized SQL queries to prevent injection attacks
- Validation of all input data
