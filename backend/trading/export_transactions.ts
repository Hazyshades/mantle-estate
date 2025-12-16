import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

interface ExportTransactionsResponse {
  csv: string;
}

export const exportTransactions = api<void, ExportTransactionsResponse>(
  { auth: true, expose: true, method: "GET", path: "/trading/export" },
  async () => {
    const auth = getAuthData()!;
    const userId = auth.userID;
    const rows = await db.queryAll<{
      transaction_type: string;
      city_name: string;
      quantity: number;
      price: number;
      fee: number;
      pnl: number | null;
      timestamp: Date;
    }>`
      SELECT
        t.transaction_type, c.name as city_name,
        t.quantity, t.price, t.fee, t.pnl, t.timestamp
      FROM transactions t
      JOIN cities c ON t.city_id = c.id
      WHERE t.user_id = ${userId}
      ORDER BY t.timestamp DESC
    `;

    // Create CSV header
    const header = "Timestamp,Type,City,Quantity (sqm),Price (USD/sqm),Fee (USD),P&L (USD)\n";

    // Create CSV rows
    const csvRows = rows.map((row) => {
      const timestamp = row.timestamp.toISOString();
      const pnl = row.pnl !== null ? row.pnl.toFixed(2) : "";
      return `${timestamp},${row.transaction_type},${row.city_name},${row.quantity.toFixed(2)},${row.price.toFixed(2)},${row.fee.toFixed(2)},${pnl}`;
    });

    const csv = header + csvRows.join("\n");

    return { csv };
  }
);
