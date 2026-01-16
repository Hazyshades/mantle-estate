import db from "../db";

/**
 * Internal function to get user balance by userId.
 * This can be called directly from other services without authentication.
 */
export async function getBalanceInternal(userId: string): Promise<number> {
  const user = await db.queryRow<{ balance: number }>`
    SELECT balance FROM users WHERE id = ${userId}
  `;

  if (!user) {
    // Return 0 if user doesn't exist (user will be created on first auth)
    return 0;
  }

  return user.balance;
}
