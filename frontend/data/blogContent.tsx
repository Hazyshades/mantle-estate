import React from "react";
import { BlockMath, InlineMath } from "react-katex";
import "katex/dist/katex.min.css"; 
import chart1HomePriceTrends from "@/components/ui/1 pitch/Chart1_Home-Price-Trends-Following-Economic-Recessions.png";

export const blogContent: Record<string, React.ReactElement> = {
  "mantle-estate-v0.1": (
    <div className="space-y-12 prose prose-slate dark:prose-invert max-w-none">
      {/* Abstract */}
      <section>
        <h2 className="text-3xl font-bold mb-4">Abstract</h2>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Mantle Estate v0.1 is a decentralized protocol designed for perpetual synthetic real estate trading on the Mantle Network. 
          The protocol enables traders to gain exposure to real estate price movements across multiple global markets without owning physical property. 
          Mantle Estate v0.1 employs a novel pricing mechanism that combines oracle-based market prices with dynamic index pricing based on position skew, 
          ensuring fair execution while maintaining price discovery through funding rates and leverage.
        </p>
      </section>

      {/* Introduction */}
      <section>
        <h2 className="text-3xl font-bold mb-4">Introduction</h2>
        <p className="text-muted-foreground mb-4">
          Mantle Estate v0.1 combines elements of perpetual futures markets and synthetic asset protocols to create an efficient 
          trading platform for real estate exposure. The protocol uses a two-tier pricing system: Market Price from external oracles 
          (such as Zillow Home Value Index) and Index Price that adjusts based on trading activity and position imbalances.
        </p>
        <p className="text-muted-foreground">
          Unlike traditional real estate investment, Mantle Estate allows traders to open long or short positions with leverage, 
          enabling both bullish and bearish strategies. The protocol operates on the Mantle Network using tUSDC as collateral (in testing mode), 
          ensuring fast transactions and low fees.
        </p>
      </section>

      {/* Key Features */}
      <section>
        <h2 className="text-3xl font-bold mb-6">Key Features</h2>
        
        <div className="space-y-4">
          <div className="border-l-4 border-primary pl-4">
            <h3 className="text-xl font-semibold mb-2">Isolated Markets</h3>
            <p className="text-muted-foreground">
              Each city represents an isolated trading market where traders can gain exposure to real estate price movements. 
              Each market has its own long-short skew, funding rate, and price dynamics. Markets are independent, 
              allowing traders to diversify across multiple real estate markets.
            </p>
          </div>

          <div className="border-l-4 border-primary pl-4">
            <h3 className="text-xl font-semibold mb-2">Price Execution</h3>
            <p className="text-muted-foreground">
              Positions are opened at Fill Price, which accounts for price impact based on trade size and current market skew. 
              Positions are closed at Index Price, ensuring fair execution relative to the underlying market price. 
              The Index Price smoothly adjusts based on position imbalances, with a maximum deviation of 5% from Market Price.
            </p>
          </div>

          <div className="border-l-4 border-primary pl-4">
            <h3 className="text-xl font-semibold mb-2">Zero Credit Risk</h3>
            <p className="text-muted-foreground">
              The protocol does not offer margin borrowing. Instead, traders can select leverage up to 2x to amplify price movements. 
              The protocol is compensated for this risk through funding rates and trading fees. All positions are fully collateralized.
            </p>
          </div>

          <div className="border-l-4 border-primary pl-4">
            <h3 className="text-xl font-semibold mb-2">Liquidity Provision</h3>
            <p className="text-muted-foreground">
              Liquidity providers can deposit USDC into liquidity pools to earn fees from trading activity. 
              LPs take on the opposite side of net trader profit and loss, earning fees when traders lose and paying out when traders profit. 
              Liquidity tokens represent pro rata ownership of pool assets.
            </p>
          </div>

          <div className="border-l-4 border-primary pl-4">
            <h3 className="text-xl font-semibold mb-2">Skew Management</h3>
            <p className="text-muted-foreground">
              The protocol uses two mechanisms to manage open interest imbalances: funding rates and index price adjustments. 
              Funding rates incentivize balance by making the majority side pay the minority side. Index price adjustments 
              provide better execution for trades that improve balance.
            </p>
          </div>
        </div>
      </section>

      {/* Markets */}
      <section>
        <h2 className="text-3xl font-bold mb-4">Markets</h2>
        <p className="text-muted-foreground mb-4">
          Markets are isolated trading venues for specific real estate markets. Each market represents a city or metropolitan area 
          with its own price feed, funding rate, and trading activity. Markets are created for major real estate markets globally, 
          including cities in the United States, Europe, and Asia-Pacific regions.
        </p>
        <p className="text-muted-foreground">
          Each market has a single collateral token (tUSDC) and a single price feed. Market prices are updated daily from external 
          data sources, with Index Price calculated in real-time based on trading activity and position skew.
        </p>
      </section>

      {/* Pricing Model */}
      <section>
        <h2 className="text-3xl font-bold mb-6">Pricing Model</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-2xl font-semibold mb-4">Market Price</h3>
            <p className="text-muted-foreground mb-4">
              Market Price reflects the real-world value of real estate in a given market. It is sourced from external data providers:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
              <li><strong>United States:</strong> Zillow Home Value Index (ZHVI)</li>
              <li><strong>Europe & APAC:</strong> Official real estate indices and market reports</li>
            </ul>
            <p className="text-muted-foreground">
              Market Price is updated daily and serves as the baseline for all pricing calculations.
            </p>
          </div>

          <div>
            <h3 className="text-2xl font-semibold mb-4">Index Price</h3>
            <p className="text-muted-foreground mb-4">
              Index Price is the trading price that adjusts based on position imbalances. It is calculated as:
            </p>
            <div className="p-2 mb-4">
              <BlockMath math="\text{Index Price} = \text{Market Price} \times (1 + \text{adjustment})" />
              <div className="mt-4 mb-2">where:</div>
              <BlockMath math="\text{adjustment} = \text{clamp}\left(\frac{\text{skew}}{\text{SKEW\_SCALE}}, -\text{MAX\_PREMIUM}, \text{MAX\_PREMIUM}\right)" />
              <BlockMath math="\text{skew} = \text{Long OI} - \text{Short OI}" />
            </div>
            <p className="text-muted-foreground mb-2">
              <strong>Parameters:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground mb-4">
              <li><code>SKEW_SCALE</code> = 10,000,000 USD (scaling factor for smooth price changes)</li>
              <li><code>MAX_PREMIUM</code> = 0.05 (5% maximum deviation from Market Price)</li>
            </ul>
            <p className="text-muted-foreground">
              The Index Price smoothly adjusts to reflect market sentiment, with long-dominated markets trading at a premium 
              and short-dominated markets trading at a discount, up to a maximum of 5% deviation.
            </p>
          </div>

          <div>
            <h3 className="text-2xl font-semibold mb-4">Fill Price</h3>
            <p className="text-muted-foreground mb-4">
              When opening a position, traders execute at Fill Price, which accounts for the price impact of their trade:
            </p>
            <div className="p-2 mb-4">
              <BlockMath math="\text{fillPrice} = \text{indexPrice} \times \left(1 + \frac{\text{skew} + \text{signedTradeSize}/2}{\text{SKEW\_SCALE}}\right)" />
              <div className="mt-4 mb-2">where:</div>
              <div className="text-muted-foreground mb-2">
                <InlineMath math="\text{signedTradeSize} = \text{tradeSize}" /> (if long) or <InlineMath math="-\text{tradeSize}" /> (if short)
              </div>
            </div>
            <p className="text-muted-foreground mb-4">
              Price Impact measures how much the execution price differs from Index Price:
            </p>
            <div className="p-2 mb-4">
              <BlockMath math="\text{priceImpact} = \frac{\text{fillPrice} - \text{indexPrice}}{\text{indexPrice}}" />
            </div>
            <p className="text-muted-foreground">
              This mechanism ensures that large trades that worsen imbalance pay a higher price, while trades that improve balance 
              get better execution.
            </p>
          </div>
        </div>
      </section>

      {/* Funding Rate */}
      <section>
        <h2 className="text-3xl font-bold mb-6">Funding Rate</h2>
        
        <p className="text-muted-foreground mb-4">
          Funding rates are updated to balance long and short positions. The majority side pays the minority side, 
          incentivizing traders to close majority positions and open minority positions.
        </p>

        <h3 className="text-2xl font-semibold mb-4">Cumulative Funding Rate</h3>
        <p className="text-muted-foreground mb-4">
          Funding rates are updated at the beginning of each trade and periodically throughout the day. 
          The funding rate is a per-day rate that accumulates over time.
        </p>

        <h3 className="text-2xl font-semibold mb-4">Funding Rate Calculation</h3>
        <p className="text-muted-foreground mb-4">
          The funding rate change is calculated based on normalized skew:
        </p>
        <div className="p-2 mb-4">
          <BlockMath math="\text{new\_funding\_rate} = \text{current\_funding\_rate} + \Delta_{\text{rate}}" />
          <div className="mt-4 mb-2">where:</div>
          <BlockMath math="\Delta_{\text{rate}} = \text{normalized\_skew} \times \text{MAX\_FUNDING\_VELOCITY} \times \text{days\_elapsed}" />
          <BlockMath math="\text{normalized\_skew} = \text{clamp}\left(\frac{\text{skew}}{\text{SKEW\_SCALE}}, -1, 1\right)" />
          <BlockMath math="\text{skew} = \text{Long OI} - \text{Short OI}" />
        </div>
        <p className="text-muted-foreground mb-2">
          <strong>Parameters:</strong>
        </p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground mb-4">
          <li><code>MAX_FUNDING_VELOCITY</code> = 0.01 (1% per day maximum change rate)</li>
          <li><code>SKEW_SCALE</code> = 10,000,000 USD</li>
        </ul>
        <p className="text-muted-foreground mb-4">
          When positions are balanced (skew ≈ 0), the funding rate decays towards zero to maintain equilibrium.
        </p>

        <h3 className="text-2xl font-semibold mb-4">Accrued Funding</h3>
        <p className="text-muted-foreground mb-4">
          Funding fees accumulate over the lifetime of a position and are applied when the position is closed:
        </p>
        <div className="p-2 mb-4">
          <BlockMath math="\text{Funding Fee} = \text{Position Size} \times \text{Funding Rate} \times \text{Days Held}" />
          <div className="mt-4 mb-2">where:</div>
          <BlockMath math="\text{Position Size} = \text{quantity\_sqm} \times \text{entry\_price}" />
        </div>
        <p className="text-muted-foreground mb-4">
          <strong>Direction:</strong>
        </p>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
          <li><strong>Long positions:</strong> Pay funding when rate &gt; 0, receive when rate &lt; 0</li>
          <li><strong>Short positions:</strong> Receive funding when rate &gt; 0, pay when rate &lt; 0</li>
        </ul>
        <p className="text-muted-foreground">
          This mechanism ensures that imbalanced markets naturally rebalance as traders are incentivized to take the minority side.
        </p>
      </section>

      {/* Position Management */}
      <section>
        <h2 className="text-3xl font-bold mb-6">Position Management</h2>
        
        <p className="text-muted-foreground mb-4">
          The protocol supports opening and closing positions with leverage. Positions can be fully or partially closed at any time.
        </p>

        <h3 className="text-2xl font-semibold mb-4">Leverage</h3>
        <p className="text-muted-foreground mb-4">
          Traders can select leverage up to 2x. Leverage amplifies both profits and losses:
        </p>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
          <li><strong>1x leverage:</strong> No amplification, position size equals margin</li>
          <li><strong>2x leverage:</strong> Position size is double the margin, amplifying price movements by 2x</li>
        </ul>
        <p className="text-muted-foreground">
          Leverage is applied to price movements, not through borrowing. All positions are fully collateralized with tUSDC.
        </p>

        <h3 className="text-2xl font-semibold mb-4">Profit and Loss Calculation</h3>
        <p className="text-muted-foreground mb-4">
          P&L is calculated when closing a position:
        </p>
        <div className="space-y-4 mb-4">
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-2">For Long positions:</div>
            <div className="p-2">
              <BlockMath math="\text{grossPnl} = (\text{exitPrice} - \text{entryPrice}) \times \text{quantity}" />
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-2">For Short positions:</div>
            <div className="p-2">
              <BlockMath math="\text{grossPnl} = (\text{entryPrice} - \text{exitPrice}) \times \text{quantity}" />
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-2">Net P&L:</div>
            <div className="p-2">
              <BlockMath math="\text{netPnl} = \text{grossPnl} - \text{openingFee} - \text{closingFee} - \text{fundingFee}" />
            </div>
          </div>
        </div>
        <p className="text-muted-foreground">
          The return amount is calculated as: <InlineMath math="\text{returnAmount} = \text{marginRequired} + \text{netPnl}" />
        </p>

        <h3 className="text-2xl font-semibold mb-4">Fees</h3>
        <p className="text-muted-foreground mb-4">
          The protocol charges trading fees:
        </p>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
          <li><strong>Opening fee:</strong> 0.01% of position value</li>
          <li><strong>Closing fee:</strong> 0.01% of current position value</li>
          <li><strong>Funding fee:</strong> Applied based on funding rate and time held</li>
        </ul>
        <p className="text-muted-foreground">
          Fees are deducted from the position's margin or P&L, ensuring the protocol remains sustainable.
        </p>
      </section>

      {/* Market Metrics */}
      <section>
        <h2 className="text-3xl font-bold mb-6">Market Metrics</h2>
        
        <p className="text-muted-foreground mb-4">
          Each market tracks key metrics to help traders make informed decisions:
        </p>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
          <li><strong>Volume 24h:</strong> Total trading volume over the last 24 hours</li>
          <li><strong>Open Interest (OI):</strong> Total value of all open positions (Long OI + Short OI)</li>
          <li><strong>Long OI / Short OI:</strong> Total value of long and short positions separately</li>
          <li><strong>Available OI:</strong> Maximum additional positions that can be opened</li>
          <li><strong>Skew:</strong> Difference between Long OI and Short OI</li>
          <li><strong>Funding Rate:</strong> Current funding rate (positive = longs pay, negative = shorts pay)</li>
        </ul>
        <p className="text-muted-foreground">
          These metrics are updated in real-time and help traders understand market conditions and potential price impacts.
        </p>
      </section>

      {/* Oracles */}
      <section>
        <h2 className="text-3xl font-bold mb-4">Oracles</h2>
        <p className="text-muted-foreground mb-4">
          Market prices are sourced from external data providers:
        </p>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
          <li><strong>Zillow Home Value Index (ZHVI):</strong> For US markets, updated monthly</li>
          <li><strong>Official indices:</strong> For European and APAC markets</li>
        </ul>
        <p className="text-muted-foreground">
          Prices are updated daily through automated data imports. The protocol uses these oracle prices as the baseline 
          for Market Price, which then feeds into Index Price calculations.
        </p>
      </section>

      {/* Security */}
      <section>
        <h2 className="text-3xl font-bold mb-4">Security</h2>
        <p className="text-muted-foreground mb-4">
          Mantle Estate v0.1 prioritizes security through multiple layers:
        </p>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
          <li><strong>Smart Contracts:</strong> Built on Mantle Network using OpenZeppelin libraries</li>
          <li><strong>Authentication:</strong> Clerk-based authentication for secure user access</li>
          <li><strong>Database:</strong> Parameterized SQL queries to prevent injection attacks</li>
          <li><strong>Input Validation:</strong> All user inputs are validated before processing</li>
        </ul>
        <p className="text-muted-foreground">
          The protocol uses USDC as collateral, ensuring stability and compatibility with the broader DeFi ecosystem on Mantle.
        </p>
      </section>
    </div>
  ),
  "roadmap": (
    <div className="space-y-12 prose prose-slate dark:prose-invert max-w-none">
      <section>
        <h2 className="text-3xl font-bold mb-4">Roadmap</h2>
        <div className="space-y-4 text-muted-foreground">
          <p>As of Q1 2026, we are actively testing our mathematical models.</p>
          <p>
            We are still in testnet mode and actively testing best practices and mechanics.
          </p>
          <p>
            We are currently in the process of fully transitioning to on-chain oracle operations and LP pool functionality.
          </p>
          <p>
            Once the mechanism is refined and we have high confidence in its operation, we will transition the platform fully to on-chain mechanics.
          </p>

          <h3 className="text-xl font-semibold mt-6">Q1 2026</h3>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Full on-chain work:</strong> oracles, LP, AMM</li>
            <li><strong>Whitepaper v1:</strong> created and published</li>
            <li><strong>Early Access:</strong> platform rollout</li>
            <li><strong>Leverage:</strong> x2–x10</li>
            <li><strong>MNT collateral:</strong> use MNT as the primary collateral</li>
            <li><strong>APAC market expansion:</strong> China, Thailand, Vietnam, Indonesia</li>
            <li><strong>Real estate pricing methodology release:</strong> US regions and APAC</li>
          </ul>
        </div>
      </section>
    </div>
  ),
  "one-pager-pitch": (
    <div className="space-y-12 prose prose-slate dark:prose-invert max-w-none">
      <section>
        <h2 className="text-3xl font-bold mb-4">Mantle Estate — One-pager Pitch</h2>
        <div className="space-y-6 text-muted-foreground">
          <div>
            <h3 className="text-2xl font-semibold text-foreground mb-2">Problem</h3>
            <p>
              Real estate is one of the largest asset classes, but it is illiquid, local, and hard
              to access for active trading. Investors struggle to hedge price declines in specific
              cities, while global diversification requires capital, time, and legal infrastructure.
            </p>
            <img
              src={chart1HomePriceTrends}
              alt="Home price trends following economic recessions"
              className="mt-4 w-full rounded-lg border border-border/60"
              loading="lazy"
            />
          </div>

          <div>
            <h3 className="text-2xl font-semibold text-foreground mb-2">Solution</h3>
            <p>
              Mantle Estate is a decentralized protocol for trading synthetic real estate on the
              Mantle Network. Users gain exposure to city-level real estate prices without owning
              physical property: they can open long/short positions, use leverage, and exit at any
              time.
            </p>
            <p className="mt-4 font-medium text-foreground">Key mechanisms:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>
                Two-tier pricing: Market Price from oracles + Index Price adjusted by position
                imbalance.
              </li>
              <li>Funding rate balances the market: majority pays minority.</li>
              <li>Isolated city markets with separate OI, skew, and price dynamics.</li>
              <li>tUSDC collateral in testing mode, fast transactions, and low fees on Mantle.</li>
            </ul>
            <p className="mt-2">
              Source:{" "}
              <a
                href="https://mantle-estate-frontend.vercel.app/blog/mantle-estate-v0.1"
                className="font-medium underline underline-offset-4"
              >
                Mantle Estate v0.1
              </a>
            </p>
          </div>

          <div>
            <h3 className="text-2xl font-semibold text-foreground mb-2">Business model</h3>
            <ul className="list-disc list-inside space-y-2">
              <li>Trading fees: charged on opening and closing positions.</li>
              <li>
                Funding mechanics: fee redistribution that supports liquidity balance.
              </li>
              <li>
                LP pools: liquidity providers earn from trading activity and take the opposite
                side of net trader P&amp;L.
              </li>
              <li>
                Scale through new markets (cities/regions) and growing trading volume.
              </li>
            </ul>
            <p className="mt-2">
              Source:{" "}
              <a
                href="https://mantle-estate-frontend.vercel.app/blog/mantle-estate-v0.1"
                className="font-medium underline underline-offset-4"
              >
                Mantle Estate v0.1
              </a>
            </p>
          </div>

          <div>
            <h3 className="text-2xl font-semibold text-foreground mb-2">Roadmap (Q1 2026)</h3>
            <ul className="list-disc list-inside space-y-2">
              <li>Full on-chain infrastructure: oracles, LP, AMM</li>
              <li>Whitepaper v1</li>
              <li>Early Access platform rollout</li>
              <li>Leverage x2–x10</li>
              <li>APAC expansion: China, Thailand, Vietnam, Indonesia</li>
              <li>Real estate pricing methodology for the US and APAC</li>
            </ul>
            <p className="mt-2">
              Source:{" "}
              <a
                href="https://mantle-estate-frontend.vercel.app/blog/roadmap"
                className="font-medium underline underline-offset-4"
              >
                Roadmap
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  ),
};

export function getBlogContent(slug: string): React.ReactElement | null {
  return blogContent[slug] || null;
}
