import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";
import { ethers } from "ethers";
import { secret } from "encore.dev/config";

const TEST_USDC_ADDRESS = "0x8136564cfec628dc62c963bad34ccc58d792aae3"; // TestUSDC token address
const MANTLE_SEPOLIA_CHAIN_ID = 5003;
const DAILY_MINT_LIMIT = 10_000 * 1_000_000; // 10,000 USDC in smallest units (6 decimals)

const mantleRpcUrl = secret("MantleSepoliaRPCUrl");

interface MintUSDCRequest {
  txHash: string; // Transaction hash from user's MetaMask mint
  walletAddress: string;
}

interface MintUSDCResponse {
  success: boolean;
  message: string;
  txHash?: string;
  remainingDailyLimit?: number;
}

/**
 * Verify and record mint transaction after user mints tokens via MetaMask
 * User must call mint() on the contract first, then submit txHash here
 * Daily limit: 10,000 USDC per wallet
 */
async function verifyMintTransaction(
  txHash: string,
  walletAddress: string
): Promise<{ amount: bigint; to: string }> {
  try {
    let rpcUrl: string;
    try {
      const secretValue = mantleRpcUrl();
      rpcUrl = secretValue || "https://rpc.sepolia.mantle.xyz";
    } catch {
      rpcUrl = "https://rpc.sepolia.mantle.xyz";
    }
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    // Get transaction receipt
    const receipt = await provider.getTransactionReceipt(txHash);
    
    if (!receipt) {
      throw new Error("Transaction not found");
    }
    
    if (receipt.status !== 1) {
      throw new Error("Transaction failed");
    }
    
    // Verify transaction was sent to TestUSDC contract
    if (receipt.to?.toLowerCase() !== TEST_USDC_ADDRESS.toLowerCase()) {
      throw new Error("Transaction not sent to TestUSDC contract");
    }
    
    // Get transaction details to verify it's a mint call
    const tx = await provider.getTransaction(txHash);
    if (!tx) {
      throw new Error("Transaction details not found");
    }
    
    // Decode transaction data to verify it's a mint call
    const contractABI = [
      "function mint(address to, uint256 amount) external"
    ];
    const iface = new ethers.Interface(contractABI);
    
    let decoded;
    try {
      decoded = iface.parseTransaction({ data: tx.data });
    } catch (e) {
      throw new Error("Transaction is not a mint call");
    }
    
    if (!decoded || decoded.name !== "mint") {
      throw new Error("Transaction is not a mint call");
    }
    
    // Verify recipient address matches
    const mintTo = decoded.args[0] as string;
    const mintAmount = decoded.args[1] as bigint;
    
    if (mintTo.toLowerCase() !== walletAddress.toLowerCase()) {
      throw new Error("Mint recipient address does not match");
    }
    
    if (mintAmount <= 0n) {
      throw new Error("Invalid mint amount");
    }
    
    return {
      amount: mintAmount,
      to: mintTo,
    };
  } catch (error) {
    console.error("Error verifying mint transaction:", error);
    throw APIError.internal(
      `Failed to verify transaction: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export const mintUSDC = api<MintUSDCRequest, MintUSDCResponse>(
  { auth: true, expose: true, method: "POST", path: "/user/mint-usdc" },
  async (req) => {
    const auth = getAuthData()!;
    
    // Validate input
    if (!req.walletAddress || !ethers.isAddress(req.walletAddress)) {
      throw APIError.invalidArgument("Invalid wallet address");
    }

    if (!req.txHash || !/^0x[a-fA-F0-9]{64}$/.test(req.txHash)) {
      throw APIError.invalidArgument("Invalid transaction hash format");
    }

    // Check if transaction was already recorded (idempotency)
    const existingMint = await db.queryRow<{ id: bigint }>`
      SELECT id FROM mint_history WHERE tx_hash = ${req.txHash} LIMIT 1
    `;

    if (existingMint) {
      throw APIError.alreadyExists("This mint transaction has already been recorded");
    }

    // Verify transaction on-chain
    const mintDetails = await verifyMintTransaction(req.txHash, req.walletAddress);
    const amountInSmallestUnits = mintDetails.amount;
    const amountInUSDC = Number(amountInSmallestUnits) / 1_000_000;

    // Check daily limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const mintedToday = await db.queryRow<{ total: bigint }>`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM mint_history
      WHERE wallet_address = ${req.walletAddress.toLowerCase()}
        AND minted_at >= ${today}
        AND minted_at < ${tomorrow}
    `;

    const totalMintedToday = Number(mintedToday?.total || 0n);
    const remainingLimit = DAILY_MINT_LIMIT - totalMintedToday;

    // Check if this mint would exceed daily limit
    if (totalMintedToday + Number(amountInSmallestUnits) > DAILY_MINT_LIMIT) {
      throw APIError.resourceExhausted(
        `Daily limit exceeded. You can mint up to ${DAILY_MINT_LIMIT / 1_000_000} USDC per day. ` +
        `Already minted today: ${(totalMintedToday / 1_000_000).toFixed(2)} USDC. ` +
        `This mint would add ${amountInUSDC.toFixed(2)} USDC, exceeding the limit.`
      );
    }

    try {
      // Record mint in database with transaction hash
      // Note: Minting tUSDC on blockchain does NOT update user balance in users table
      // Balance is only updated when user deposits tokens via deposit() function
      await db.exec`
        INSERT INTO mint_history (wallet_address, amount, tx_hash)
        VALUES (${req.walletAddress.toLowerCase()}, ${amountInSmallestUnits}, ${req.txHash})
      `;

      const newRemainingLimit = remainingLimit - Number(amountInSmallestUnits);

      return {
        success: true,
        message: `Successfully recorded mint of ${amountInUSDC.toFixed(2)} USDC`,
        txHash: req.txHash,
        remainingDailyLimit: newRemainingLimit / 1_000_000,
      };
    } catch (error: any) {
      console.error("Error recording mint:", error);
      throw APIError.internal(
        `Failed to record mint: ${error.message || "Unknown error"}`
      );
    }
  }
);

/**
 * Get daily mint limit information for a wallet
 */
interface GetMintLimitRequest {
  walletAddress: string;
}

export const getMintLimit = api<GetMintLimitRequest, { mintedToday: number; remaining: number; limit: number }>(
  { auth: true, expose: true, method: "GET", path: "/user/mint-limit" },
  async (req) => {
    if (!req.walletAddress || !ethers.isAddress(req.walletAddress)) {
      throw APIError.invalidArgument("Invalid wallet address");
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const mintedToday = await db.queryRow<{ total: bigint }>`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM mint_history
      WHERE wallet_address = ${req.walletAddress.toLowerCase()}
        AND minted_at >= ${today}
        AND minted_at < ${tomorrow}
    `;

    const totalMintedToday = Number(mintedToday?.total || 0n);
    const remaining = DAILY_MINT_LIMIT - totalMintedToday;

    return {
      mintedToday: totalMintedToday / 1_000_000,
      remaining: Math.max(0, remaining / 1_000_000),
      limit: DAILY_MINT_LIMIT / 1_000_000,
    };
  }
);

