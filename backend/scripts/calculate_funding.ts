/**
 * Script for calculating funding fee for a position
 * 
 * Funding fee formula:
 * Funding Fee = Position Size × Funding Rate × Time Period
 * 
 * Where:
 * - Position Size = quantity_sqm × current_price (or average price)
 * - Funding Rate = current funding rate (positive = longs pay, negative = shorts pay)
 * - Time Period = time in days
 * 
 * IMPORTANT: Funding is usually paid every 8 hours (3 times a day) or daily
 */

// Parameters for the position (from the user's question)
const positionSizeUsd = 1_256_100; // Position size in USD (with leverage)
const entryPrice = 331_468.70; // Index price at the time of position opening
const positionType: "long" | "short" = "long"; // Position type: "long" or "short" (specify!)
const leverage = 1; // Leverage (1 or 2) (specify!)

// Calculation of the number of square meters
const quantitySqm = positionSizeUsd / entryPrice;

console.log("=== Calculation of Funding for the position ===");
console.log(`Position size: $${positionSizeUsd.toLocaleString()}`);
console.log(`Entry price: $${entryPrice.toLocaleString()}`);
console.log(`Quantity of sqm: ${quantitySqm.toFixed(4)} sqm`);
console.log(`Position type: ${positionType.toUpperCase()}`);
console.log(`Leverage: ${leverage}x`);
console.log("");

// Examples of funding rate (need to get the actual from the database)
const fundingRates = [
  { rate: 0.0001, description: "0.01% (very low)" },
  { rate: 0.001, description: "0.1% (low)" },
  { rate: 0.01, description: "1% (medium)" },
  { rate: 0.05, description: "5% (high)" },
];

// Time holding of the position (in days)
const timePeriods = [1, 7, 30, 90]; // 1 day, 1 week, 1 month, 3 months

console.log("=== Calculation of Funding Fee ===");
console.log("");

for (const { rate, description } of fundingRates) {
  console.log(`--- Funding Rate: ${(rate * 100).toFixed(4)}% (${description}) ---`);
  
  for (const days of timePeriods) {
    // Funding fee = Position Size × Funding Rate × Days
    // For long: if rate > 0, then we pay (negative fee)
    // For short: if rate > 0, then we get (positive fee)
    
    const fundingFee = positionSizeUsd * rate * days;
    
    // Determine if we pay or get
    let feeDirection: string;
    let feeAmount: number;
    
    if (positionType === "long") {
      // Long pays if funding rate is positive
      feeAmount = rate > 0 ? -fundingFee : fundingFee;
      feeDirection = rate > 0 ? "PAY" : "GET";
    } else {
      // Short gets if funding rate is positive
      feeAmount = rate > 0 ? fundingFee : -fundingFee;
      feeDirection = rate > 0 ? "GET" : "PAY";
    }
    
    console.log(`  For ${days} ${days === 1 ? "day" : days < 5 ? "days" : "days"}: ${feeDirection} $${Math.abs(feeAmount).toFixed(2)}`);
  }
  
  console.log("");
}

console.log("\n=== Calculation formula ===");
console.log("Funding Fee = Position Size × Funding Rate × Days");
console.log(`Position Size = $${positionSizeUsd.toLocaleString()}`);
console.log("");

console.log("=== Notes ===");
console.log("1. Funding rate is updated periodically based on the market skew");
console.log("2. If funding rate is positive: Long positions pay Short positions");
console.log("3. If funding rate is negative: Short positions pay Long positions");
console.log("4. To get the exact funding rate, you need to request it from the database");
console.log("5. Funding is usually paid every 8 hours (3 times a day) or daily");
console.log("6. The real funding rate for Chicago can be obtained through the API: GET /cities");
console.log("");

console.log("=== Example calculation for a typical funding rate ===");
console.log("Typical funding rate for real estate: 0.01% - 0.1% per day");
console.log(`For funding rate 0.01% per day: $${(positionSizeUsd * 0.0001).toFixed(2)} per day`);
console.log(`For funding rate 0.1% per day: $${(positionSizeUsd * 0.001).toFixed(2)} per day`);

