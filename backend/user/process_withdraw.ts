import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";
import { ethers } from "ethers";

interface ProcessWithdrawRequest {
  withdrawId: number;
  txHash: string;
  blockNumber: bigint | number;
  amount: number; // in smallest units (6 decimals)
  walletAddress: string;
  userId: string;
  userIdHash: string;
  timestamp: number;
  nonce: number;
}

interface ProcessWithdrawResponse {
  success: boolean;
  message: string;
  newBalance: number;
}

/**
 * Process a withdrawal from blockchain event
 * This endpoint is called after a successful withdrawal transaction on the blockchain
 */
export const processWithdraw = api<ProcessWithdrawRequest, ProcessWithdrawResponse>(
  { auth: true, expose: true, method: "POST", path: "/user/process-withdraw" },
  async (req) => {
    const auth = getAuthData()!;
    const authenticatedUserId = auth.userID;

    // Verify that the userId matches the authenticated user
    if (req.userId !== authenticatedUserId) {
      throw new APIError(
        "permission_denied",
        "User ID does not match authenticated user"
      );
    }

    // Validate input
    if (!req.txHash || !req.walletAddress || !ethers.isAddress(req.walletAddress)) {
      throw new APIError("invalid_argument", "Invalid transaction hash or wallet address");
    }

    if (req.amount <= 0) {
      throw new APIError("invalid_argument", "Withdrawal amount must be positive");
    }

    // Check if withdraw was already processed (idempotency)
    const existingWithdraw = await db.queryRow<{ id: bigint }>`
      SELECT id FROM withdrawals
      WHERE withdraw_id = ${req.withdrawId} OR tx_hash = ${req.txHash}
      LIMIT 1
    `;

    if (existingWithdraw) {
      throw new APIError(
        "already_exists",
        "This withdrawal has already been processed"
      );
    }

    // Convert amount from smallest units (6 decimals) to USDC
    const amountInUSDC = req.amount / 1_000_000;

    // Start transaction
    const tx = await db.begin();

    try {
      // Check if user exists and get balance
      const user = await tx.queryRow<{ id: string; balance: number }>`
        SELECT id, balance FROM users WHERE id = ${req.userId} FOR UPDATE
      `;

      if (!user) {
        throw new APIError("not_found", "User not found");
      }

      // Check if user has sufficient balance
      if (user.balance < amountInUSDC) {
        throw new APIError(
          "insufficient_funds",
          `Insufficient balance. Available: ${user.balance.toFixed(2)} USDC, Requested: ${amountInUSDC.toFixed(2)} USDC`
        );
      }

      // Update user balance
      await tx.exec`
        UPDATE users
        SET balance = balance - ${amountInUSDC}
        WHERE id = ${req.userId}
      `;

      // Insert withdrawal record
      await tx.exec`
        INSERT INTO withdrawals (
          user_id,
          withdraw_id,
          tx_hash,
          wallet_address,
          amount,
          block_number,
          timestamp,
          nonce
        )
        VALUES (
          ${req.userId},
          ${req.withdrawId},
          ${req.txHash},
          ${req.walletAddress.toLowerCase()},
          ${req.amount},
          ${req.blockNumber},
          ${req.timestamp},
          ${req.nonce}
        )
      `;

      // Get updated balance before commit
      const updatedUser = await tx.queryRow<{ balance: number }>`
        SELECT balance FROM users WHERE id = ${req.userId}
      `;

      if (!updatedUser) {
        throw new APIError("not_found", "User not found after update");
      }

      const finalBalance = updatedUser.balance;

      await tx.commit();

      return {
        success: true,
        message: `Withdrawal of ${amountInUSDC.toFixed(2)} USDC processed successfully`,
        newBalance: finalBalance,
      };
    } catch (error: any) {
      await tx.rollback();
      console.error("Error processing withdrawal:", error);
      throw new APIError(
        "internal",
        `Failed to process withdrawal: ${error.message || "Unknown error"}`
      );
    }
  }
);

