import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

interface GetUserInfoResponse {
  walletAddress: string | null;
}

export const getUserInfo = api<void, GetUserInfoResponse>(
  { auth: true, expose: true, method: "GET", path: "/user/info" },
  async () => {
    const auth = getAuthData()!;
    const userId = auth.userID;

    const user = await db.queryRow<{ wallet_address: string | null }>`
      SELECT wallet_address FROM users WHERE id = ${userId}
    `;

    if (!user) {
      // If user doesn't exist yet, return wallet address from auth
      return { walletAddress: auth.walletAddress };
    }

    return { walletAddress: user.wallet_address };
  }
);

