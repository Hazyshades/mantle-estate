# Smart Contracts

All smart contracts are deployed on **Mantle Sepolia Testnet** (Chain ID: 5003).

## Core Contracts

| Contract | Address | Explorer | Description |
|----------|---------|----------|-------------|
| **TestUSDC (tUSDC)** | `0x8136564cfec628dc62c963bad34ccc58d792aae3` | [View](https://sepolia.mantlescan.xyz/token/0x8136564cfec628dc62c963bad34ccc58d792aae3) | Test USDC token (6 decimals) |
| **MantleEstateDeposit** | `0x54fDDAbe007fa60cA84d1DeA27E6400c99E290ca` | [View](https://sepolia.mantlescan.xyz/address/0x54fDDAbe007fa60cA84d1DeA27E6400c99E290ca) | Contract for deposits and balance management |

## LP Pool Contracts (by City)

| City | Code | Contract | Address | Explorer |
|------|------|----------|---------|----------|
| **Hong Kong** | HKG | `MantleEstateLPPoolHongKong` | `0xf15EcEB2F22C5eD3705bd08d79F19d9F7cc8Cdf4` | [View](https://sepolia.mantlescan.xyz/address/0xf15EcEB2F22C5eD3705bd08d79F19d9F7cc8Cdf4) |
| **Seoul** | SEL | `MantleEstateLPPoolSeoul` | `0x4108E9931232691Cfc6f4491C062dA50dE630E40` | [View](https://sepolia.mantlescan.xyz/address/0x4108E9931232691Cfc6f4491C062dA50dE630E40) |
| **Shanghai** | SHA | `MantleEstateLPPoolShanghai` | `0xd0Cc15de7Eb2311DD615aa83882f10aCB1Da9584` | [View](https://sepolia.mantlescan.xyz/address/0xd0Cc15de7Eb2311DD615aa83882f10aCB1Da9584) |
| **Singapore** | SGP | `MantleEstateLPPoolSingapore` | `0xAfd2424360b5382C7845D5610a6965387ca4acaB` | [View](https://sepolia.mantlescan.xyz/address/0xAfd2424360b5382C7845D5610a6965387ca4acaB) |
| **Sydney** | SYD | `MantleEstateLPPoolSydney` | `0x2b90097bcaf3de15727a5c7ee641cda7a03d3561` | [View](https://sepolia.mantlescan.xyz/address/0x2b90097bcaf3de15727a5c7ee641cda7a03d3561) |
| **Tokyo** | TYO | `MantleEstateLPPoolTokyo` | `0x94aC2f5136c833fCa493552E7d8b178034b20f4A` | [View](https://sepolia.mantlescan.xyz/address/0x94aC2f5136c833fCa493552E7d8b178034b20f4A) |

## LP Operator Contract

| Contract | Address | Description |
|----------|---------|-------------|
| **MantleEstate LP Operator** | `0x62e72f83aaae864ac3d6686820f2e04777f80b29` | Operator contract for managing LP pools (collecting fees, paying out profits) |