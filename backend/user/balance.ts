import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

interface BalanceResponse {
  balance: number;
}

export const getBalance = api<void, BalanceResponse>(
  { auth: true, expose: true, method: "GET", path: "/user/balance" },
  async () => {
    const auth = getAuthData()!;
    const userId = auth.userID;

    let user = await db.queryRow<{ balance: number }>`
      SELECT balance FROM users WHERE id = ${userId}
    `;

    if (!user) {
      await db.exec`
        INSERT INTO users (id, email, balance)
        VALUES (${userId}, ${auth.email}, 100.0)
      `;
      user = { balance: 100.0 };
    }

    return { balance: user.balance };
  }
);
