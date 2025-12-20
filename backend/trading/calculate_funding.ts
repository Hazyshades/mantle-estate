import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

interface CalculateFundingRequest {
  positionId?: number; // If specified, calculates for a specific position
  positionSizeUsd?: number; // Position size in USD
  entryPrice?: number; // Entry price
  cityName?: string; // City name
  days?: number; // Number of days for calculation (if not specified, uses the position holding time)
}

interface CalculateFundingResponse {
  positionId?: number;
  cityName: string;
  positionType: "long" | "short";
  positionSize: number;
  entryPrice: number;
  quantitySqm: number;
  leverage: number;
  openedAt: Date;
  daysHeld: number;
  currentFundingRate: number;
  accumulatedFundingFee: number;
  fundingFeeDirection: "pay" | "receive"; // "pay" = you pay, "receive" = you receive
  projectedFunding: Array<{
    days: number;
    fee: number;
    direction: "pay" | "receive";
  }>;
}

/**
 * Calculate funding fee for a position
 */
export const calculateFunding = api<CalculateFundingRequest, CalculateFundingResponse>(
  { auth: true, expose: true, method: "POST", path: "/trading/calculate-funding" },
  async (req) => {
    const auth = getAuthData()!;
    const userId = auth.userID;

    let position: {
      id: number;
      city_id: number;
      city_name: string;
      position_type: string;
      quantity_sqm: number;
      entry_price: number;
      leverage: number;
      margin_required: number;
      opened_at: Date;
    } | null = null;

    // If positionId is specified, find the position by ID
    if (req.positionId) {
      const pos = await db.queryRow<{
        id: number;
        city_id: number;
        city_name: string;
        position_type: string;
        quantity_sqm: number;
        entry_price: number;
        leverage: number;
        margin_required: number;
        opened_at: Date;
      }>`
        SELECT 
          p.id, p.city_id, c.name as city_name,
          p.position_type, p.quantity_sqm, p.entry_price,
          p.leverage, p.margin_required, p.opened_at
        FROM positions p
        JOIN cities c ON p.city_id = c.id
        WHERE p.id = ${req.positionId}
          AND p.user_id = ${userId}
          AND p.closed_at IS NULL
      `;

      if (!pos) {
        throw APIError.notFound("Position not found or already closed");
      }

      position = pos;
    } 
    // Otherwise, search by parameters
    else if (req.positionSizeUsd && req.entryPrice && req.cityName) {
      const pos = await db.queryRow<{
        id: number;
        city_id: number;
        city_name: string;
        position_type: string;
        quantity_sqm: number;
        entry_price: number;
        leverage: number;
        margin_required: number;
        opened_at: Date;
      }>`
        SELECT 
          p.id, p.city_id, c.name as city_name,
          p.position_type, p.quantity_sqm, p.entry_price,
          p.leverage, p.margin_required, p.opened_at
        FROM positions p
        JOIN cities c ON p.city_id = c.id
        WHERE c.name = ${req.cityName}
          AND p.user_id = ${userId}
          AND p.closed_at IS NULL
          AND ABS((p.quantity_sqm * p.entry_price) - ${req.positionSizeUsd}) < 1000
          AND ABS(p.entry_price - ${req.entryPrice}) < 100
        ORDER BY p.opened_at DESC
        LIMIT 1
      `;

      if (!pos) {
        throw APIError.notFound("Position not found with specified parameters");
      }

      position = pos;
    } else {
      throw APIError.invalidArgument("Either positionId or (positionSizeUsd, entryPrice, cityName) must be provided");
    }

    // Get the actual funding rate for the city
    const city = await db.queryRow<{
      funding_rate: number;
      index_price_usd: number;
      last_funding_update: Date | null;
    }>`
      SELECT funding_rate, index_price_usd, last_funding_update
      FROM cities
      WHERE id = ${position.city_id}
    `;

    if (!city) {
      throw APIError.notFound("City not found");
    }

    // Calculate the time held
    const now = new Date();
    const openedAt = new Date(position.opened_at);
    const daysHeld = req.days || (now.getTime() - openedAt.getTime()) / (1000 * 60 * 60 * 24);

    // Calculate the position size
    const positionSize = position.quantity_sqm * position.entry_price;

    // Calculate the funding fee
    const fundingFee = positionSize * city.funding_rate * daysHeld;

    // Determine the direction of payment
    let feeDirection: "pay" | "receive";
    let feeAmount: number;

    if (position.position_type === "long") {
      feeAmount = city.funding_rate > 0 ? -fundingFee : fundingFee;
      feeDirection = city.funding_rate > 0 ? "pay" : "receive";
    } else {
      feeAmount = city.funding_rate > 0 ? fundingFee : -fundingFee;
      feeDirection = city.funding_rate > 0 ? "receive" : "pay";
    }

    // Calculate the forecast for different periods
    const periods = [1, 7, 30, 90];
    const projectedFunding = periods.map((days) => {
      const periodFee = positionSize * city.funding_rate * days;
      const periodDirection = position.position_type === "long"
        ? (city.funding_rate > 0 ? "pay" : "receive")
        : (city.funding_rate > 0 ? "receive" : "pay");
      const periodAmount = position.position_type === "long"
        ? (city.funding_rate > 0 ? -periodFee : periodFee)
        : (city.funding_rate > 0 ? periodFee : -periodFee);

      return {
        days,
        fee: Math.abs(periodAmount),
        direction: periodDirection,
      };
    });

    return {
      positionId: position.id,
      cityName: position.city_name,
      positionType: position.position_type as "long" | "short",
      positionSize,
      entryPrice: position.entry_price,
      quantitySqm: position.quantity_sqm,
      leverage: position.leverage,
      openedAt: position.opened_at,
      daysHeld,
      currentFundingRate: city.funding_rate,
      accumulatedFundingFee: Math.abs(feeAmount),
      fundingFeeDirection: feeDirection,
      projectedFunding,
    };
  }
);

