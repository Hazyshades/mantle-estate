import React from "react";

export const blogContent: Record<string, React.ReactElement> = {
  "mantle-estate-v2": (
    <div className="space-y-12 prose prose-slate dark:prose-invert max-w-none">
      {/* Abstract */}
      <section>
        <h2 className="text-3xl font-bold mb-4">Abstract</h2>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Mantle Estate v0.1 is a decentralized protocol designed for perpetual synthetic real estate trading on the Mantle blockchain. 
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
          enabling both bullish and bearish strategies. The protocol operates on the Mantle blockchain using USDC as collateral, 
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
          Each market has a single collateral token (USDC) and a single price feed. Market prices are updated daily from external 
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
            <div className="bg-muted/50 rounded-lg p-6 mb-4 font-mono text-sm">
              <div className="mb-2">Index Price = Market Price × (1 + adjustment)</div>
              <div className="mb-2">where:</div>
              <div className="ml-4 mb-2">adjustment = clamp(skew / SKEW_SCALE, -MAX_PREMIUM, MAX_PREMIUM)</div>
              <div className="ml-4">skew = Long OI - Short OI</div>
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
            <div className="bg-muted/50 rounded-lg p-6 mb-4 font-mono text-sm">
              <div className="mb-2">fillPrice = indexPrice × (1 + (skew + signedTradeSize/2) / SKEW_SCALE)</div>
              <div className="mb-2">where:</div>
              <div className="ml-4">signedTradeSize = tradeSize (if long) or -tradeSize (if short)</div>
            </div>
            <p className="text-muted-foreground mb-4">
              Price Impact measures how much the execution price differs from Index Price:
            </p>
            <div className="bg-muted/50 rounded-lg p-6 mb-4 font-mono text-sm">
              priceImpact = (fillPrice - indexPrice) / indexPrice
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
        <div className="bg-muted/50 rounded-lg p-6 mb-4 font-mono text-sm">
          <div className="mb-2">new_funding_rate = current_funding_rate + delta_rate</div>
          <div className="mb-2">where:</div>
          <div className="ml-4 mb-2">delta_rate = normalized_skew × MAX_FUNDING_VELOCITY × days_elapsed</div>
          <div className="ml-4 mb-2">normalized_skew = clamp(skew / SKEW_SCALE, -1, 1)</div>
          <div className="ml-4">skew = Long OI - Short OI</div>
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
        <div className="bg-muted/50 rounded-lg p-6 mb-4 font-mono text-sm">
          <div className="mb-2">Funding Fee = Position Size × Funding Rate × Days Held</div>
          <div className="mb-2">where:</div>
          <div className="ml-4">Position Size = quantity_sqm × entry_price</div>
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
          Leverage is applied to price movements, not through borrowing. All positions are fully collateralized.
        </p>

        <h3 className="text-2xl font-semibold mb-4">Profit and Loss Calculation</h3>
        <p className="text-muted-foreground mb-4">
          P&L is calculated when closing a position:
        </p>
        <div className="bg-muted/50 rounded-lg p-6 mb-4 font-mono text-sm">
          <div className="mb-2">For Long positions:</div>
          <div className="ml-4 mb-2">grossPnl = (exitPrice - entryPrice) × quantity</div>
          <div className="mb-2">For Short positions:</div>
          <div className="ml-4 mb-2">grossPnl = (entryPrice - exitPrice) × quantity</div>
          <div className="mb-2">netPnl = grossPnl - openingFee - closingFee - fundingFee</div>
        </div>
        <p className="text-muted-foreground">
          The return amount is calculated as: <code>returnAmount = marginRequired + netPnl</code>
        </p>

        <h3 className="text-2xl font-semibold mb-4">Fees</h3>
        <p className="text-muted-foreground mb-4">
          The protocol charges trading fees:
        </p>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
          <li><strong>Opening fee:</strong> 0.1% (0.001) of position value</li>
          <li><strong>Closing fee:</strong> 0.1% (0.001) of current position value</li>
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
          <li><strong>Smart Contracts:</strong> Built on Mantle blockchain using OpenZeppelin libraries</li>
          <li><strong>Authentication:</strong> Clerk-based authentication for secure user access</li>
          <li><strong>Database:</strong> Parameterized SQL queries to prevent injection attacks</li>
          <li><strong>Input Validation:</strong> All user inputs are validated before processing</li>
        </ul>
        <p className="text-muted-foreground">
          The protocol uses USDC as collateral, ensuring stability and compatibility with the broader DeFi ecosystem on Mantle.
        </p>
      </section>

      {/* Future Development */}
      <section>
        <h2 className="text-3xl font-bold mb-4">Future Development</h2>
        <p className="text-muted-foreground mb-4">
          The protocol continues to evolve with planned improvements:
        </p>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
          <li>Expansion to additional real estate markets globally</li>
          <li>Enhanced analytics and charting tools</li>
          <li>Mobile application for iOS and Android</li>
          <li>API access for developers and third-party integrations</li>
          <li>Advanced order types (limit orders, stop-loss)</li>
          <li>Social trading features and copy trading</li>
        </ul>
      </section>

      {/* Call to Action */}
      <section className="border-t pt-8">
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-semibold mb-4">Ready to Start Trading?</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Join Mantle Estate and gain exposure to real estate markets around the world. Trade with leverage, 
            earn from funding rates, and diversify your portfolio with synthetic real estate.
          </p>
          <div className="flex gap-4 justify-center">
            <a 
              href="/markets" 
              className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Start Trading
            </a>
            <a 
              href="/liquidity" 
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-6 py-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              Provide Liquidity
            </a>
          </div>
        </div>
      </section>
    </div>
  ),
};

export function getBlogContent(slug: string): React.ReactElement | null {
  return blogContent[slug] || null;
}
