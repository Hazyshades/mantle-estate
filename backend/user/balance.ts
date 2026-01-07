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

    let user = await db.queryRow<{ balance: number; wallet_address: string | null }>`
      SELECT balance, wallet_address FROM users WHERE id = ${userId}
    `;

    if (!user) {
      // Create new user with wallet address if available
      await db.exec`
        INSERT INTO users (id, email, balance, wallet_address)
        VALUES (${userId}, ${auth.email}, 100.0, ${auth.walletAddress})
      `;
      user = { balance: 100.0, wallet_address: auth.walletAddress };
    } else if (auth.walletAddress && user.wallet_address !== auth.walletAddress) {
      // Update wallet address if it has changed
      await db.exec`
        UPDATE users 
        SET wallet_address = ${auth.walletAddress}
        WHERE id = ${userId}
      `;
    }

    return { balance: user.balance };
  }
);
