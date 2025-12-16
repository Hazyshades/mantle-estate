import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

export interface Transaction {
  id: number;
  transactionType: string;
  cityId: number;
  cityName: string;
  quantity: number;
  price: number;
  fee: number;
  pnl: number | null;
  timestamp: Date;
}

interface GetTransactionsResponse {
  transactions: Transaction[];
}

// Get user's transaction history
export const getTransactions = api<void, GetTransactionsResponse>(
  { auth: true, expose: true, method: "GET", path: "/trading/transactions" },
  async () => {
    const auth = getAuthData()!;
    const userId = auth.userID;
    const rows = await db.queryAll<{
      id: number;
      transaction_type: string;
      city_id: number;
      city_name: string;
      quantity: number;
      price: number;
      fee: number;
      pnl: number | null;
      timestamp: Date;
    }>`
      SELECT
        t.id, t.transaction_type, t.city_id, c.name as city_name,
        t.quantity, t.price, t.fee, t.pnl, t.timestamp
      FROM transactions t
      JOIN cities c ON t.city_id = c.id
      WHERE t.user_id = ${userId}
      ORDER BY t.timestamp DESC
    `;

    const transactions = rows.map((row) => ({
      id: row.id,
      transactionType: row.transaction_type,
      cityId: row.city_id,
      cityName: row.city_name,
      quantity: row.quantity,
      price: row.price,
      fee: row.fee,
      pnl: row.pnl,
      timestamp: row.timestamp,
    }));

    return { transactions };
  }
);
