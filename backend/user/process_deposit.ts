import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";
import { ethers } from "ethers";

interface ProcessDepositRequest {
  depositId: number;
  txHash: string;
  blockNumber: bigint | number;
  amount: number; // in smallest units (6 decimals)
  walletAddress: string;
  userId: string;
  userIdHash: string;
  timestamp: number;
  nonce: number;
}

interface ProcessDepositResponse {
  success: boolean;
  message: string;
  newBalance: number;
}

/**
 * Process a deposit from blockchain event
 * This endpoint is called after a successful deposit transaction on the blockchain
 */
export const processDeposit = api<ProcessDepositRequest, ProcessDepositResponse>(
  { auth: true, expose: true, method: "POST", path: "/user/process-deposit" },
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
      throw new APIError("invalid_argument", "Deposit amount must be positive");
    }

    // Check if deposit was already processed (idempotency)
    const existingDeposit = await db.queryRow<{ id: bigint }>`
      SELECT id FROM deposits
      WHERE deposit_id = ${req.depositId} OR tx_hash = ${req.txHash}
      LIMIT 1
    `;

    if (existingDeposit) {
      throw new APIError(
        "already_exists",
        "This deposit has already been processed"
      );
    }

    // Convert amount from smallest units (6 decimals) to USDC
    const amountInUSDC = req.amount / 1_000_000;

    // Start transaction
    const tx = await db.begin();

    try {
      // Check if user exists
      const user = await tx.queryRow<{ id: string; balance: number }>`
        SELECT id, balance FROM users WHERE id = ${req.userId} FOR UPDATE
      `;

      if (!user) {
        // Create user if doesn't exist
        await tx.exec`
          INSERT INTO users (id, email, balance, wallet_address)
          VALUES (${req.userId}, ${auth.email}, ${amountInUSDC}, ${req.walletAddress.toLowerCase()})
        `;
      } else {
        // Update user balance
        await tx.exec`
          UPDATE users
          SET balance = balance + ${amountInUSDC}
          WHERE id = ${req.userId}
        `;
      }

      // Insert deposit record
      await tx.exec`
        INSERT INTO deposits (
          user_id,
          deposit_id,
          tx_hash,
          wallet_address,
          amount,
          block_number,
          timestamp,
          nonce
        )
        VALUES (
          ${req.userId},
          ${req.depositId},
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
        message: `Deposit of ${amountInUSDC.toFixed(2)} USDC processed successfully`,
        newBalance: finalBalance,
      };
    } catch (error: any) {
      await tx.rollback();
      console.error("Error processing deposit:", error);
      throw new APIError(
        "internal",
        `Failed to process deposit: ${error.message || "Unknown error"}`
      );
    }
  }
);


