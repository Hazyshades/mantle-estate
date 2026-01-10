import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";
import { ethers } from "ethers";
import { secret } from "encore.dev/config";

const mantleRpcUrl = secret("MantleSepoliaRPCUrl");

interface DepositRequest {
  depositId: number;
  txHash: string;
  blockNumber: number;
  amount: number; // in smallest units (6 decimals for USDC)
  walletAddress: string;
  userId: string;
  userIdHash: string; // bytes32 hash of userId
  timestamp: number;
  nonce: number;
}

interface DepositResponse {
  success: boolean;
  message: string;
  depositId?: number;
}

// Contract addresses (from Deployed.md)
const DEPOSIT_CONTRACT_ADDRESS = "0x3Dc8D566FE818bD66CA1A09cF636ff426C6fCe3b";
const CHAIN_ID = 5003; // Mantle Sepolia Testnet

// Deposit event signature (first 4 bytes of keccak256 hash)
// Event: Deposit(uint256 indexed depositId, address indexed wallet, bytes32 indexed userIdHash, string userId, uint256 amount, bytes32 txHash, uint256 blockNumber, uint256 timestamp, uint256 nonce)
const DEPOSIT_EVENT_SIGNATURE = ethers.id("Deposit(uint256,address,bytes32,string,uint256,bytes32,uint256,uint256,uint256)").slice(0, 2 + 8); // First 4 bytes (8 hex chars)

/**
 * Verify deposit transaction on blockchain
 */
async function verifyDepositTransaction(
  txHash: string,
  depositId: number,
  walletAddress: string,
  userId: string,
  amount: number,
  blockNumber: number,
  timestamp: number,
  nonce: number
): Promise<boolean> {
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
    
    // Verify block number
    if (Number(receipt.blockNumber) !== blockNumber) {
      throw new Error("Block number mismatch");
    }
    
    // Verify contract address
    if (receipt.to?.toLowerCase() !== DEPOSIT_CONTRACT_ADDRESS.toLowerCase()) {
      throw new Error("Transaction not sent to deposit contract");
    }
    
    // Find Deposit event in logs
    const depositEvent = receipt.logs.find(log => {
      // Check if log is from deposit contract
      if (log.address.toLowerCase() !== DEPOSIT_CONTRACT_ADDRESS.toLowerCase()) {
        return false;
      }
      
      // Check event signature (first topic)
      return log.topics[0] === DEPOSIT_EVENT_SIGNATURE;
    });
    
    if (!depositEvent) {
      throw new Error("Deposit event not found in transaction");
    }
    
    // Decode event data
    // Event structure: Deposit(uint256 indexed depositId, address indexed wallet, bytes32 indexed userIdHash, string userId, uint256 amount, bytes32 txHash, uint256 blockNumber, uint256 timestamp, uint256 nonce)
    // Topics: [eventSignature, depositId, wallet, userIdHash]
    // Data: ABI-encoded [userId (string), amount, txHash, blockNumber, timestamp, nonce]
    
    const depositIdFromEvent = BigInt(depositEvent.topics[1]);
    // Extract address from topic (address is padded to 32 bytes in topics)
    const walletFromEvent = ethers.getAddress(ethers.dataSlice(depositEvent.topics[2], 12));
    const userIdHashFromEvent = depositEvent.topics[3];
    
    // Verify depositId
    if (Number(depositIdFromEvent) !== depositId) {
      throw new Error("Deposit ID mismatch");
    }
    
    // Verify wallet address
    if (walletFromEvent.toLowerCase() !== walletAddress.toLowerCase()) {
      throw new Error("Wallet address mismatch");
    }
    
    // Verify userIdHash
    const expectedUserIdHash = ethers.keccak256(ethers.toUtf8Bytes(userId));
    if (userIdHashFromEvent !== expectedUserIdHash) {
      throw new Error("User ID hash mismatch");
    }
    
    // Decode event data (non-indexed parameters)
    const abi = [
      "event Deposit(uint256 indexed depositId, address indexed wallet, bytes32 indexed userIdHash, string userId, uint256 amount, bytes32 txHash, uint256 blockNumber, uint256 timestamp, uint256 nonce)"
    ];
    const iface = new ethers.Interface(abi);
    const decoded = iface.parseLog({
      topics: depositEvent.topics,
      data: depositEvent.data
    });
    
    if (!decoded) {
      throw new Error("Failed to decode event");
    }
    
    // Verify amount
    if (Number(decoded.args.amount) !== amount) {
      throw new Error("Amount mismatch");
    }
    
    // Verify block number
    if (Number(decoded.args.blockNumber) !== blockNumber) {
      throw new Error("Block number mismatch in event");
    }
    
    // Verify timestamp (allow some tolerance for block timestamp)
    const timestampDiff = Math.abs(Number(decoded.args.timestamp) - timestamp);
    if (timestampDiff > 60) { // 60 seconds tolerance
      throw new Error("Timestamp mismatch");
    }
    
    // Verify nonce
    if (Number(decoded.args.nonce) !== nonce) {
      throw new Error("Nonce mismatch");
    }
    
    // Verify txHash in event matches
    if (decoded.args.txHash !== txHash) {
      throw new Error("Transaction hash mismatch in event");
    }
    
    return true;
  } catch (error) {
    console.error("Error verifying deposit transaction:", error);
    throw new APIError(
      "internal",
      `Failed to verify transaction: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Verify wallet is linked to userId in contract
 */
async function verifyWalletLink(walletAddress: string, userId: string): Promise<boolean> {
  try {
    let rpcUrl: string;
    try {
      const secretValue = mantleRpcUrl();
      rpcUrl = secretValue || "https://rpc.sepolia.mantle.xyz";
    } catch {
      rpcUrl = "https://rpc.sepolia.mantle.xyz";
    }
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    // Contract ABI for getUserId function
    const abi = [
      "function getUserId(address wallet) external view returns (string memory)"
    ];
    const contract = new ethers.Contract(DEPOSIT_CONTRACT_ADDRESS, abi, provider);
    
    const linkedUserId = await contract.getUserId(walletAddress);
    
    // Compare userIds (handle empty string case)
    if (linkedUserId === "") {
      return false;
    }
    
    return linkedUserId === userId;
  } catch (error) {
    console.error("Error verifying wallet link:", error);
    throw new APIError(
      "internal",
      `Failed to verify wallet link: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export const deposit = api<DepositRequest, DepositResponse>(
  { auth: true, expose: true, method: "POST", path: "/user/deposit" },
  async (req) => {
    const auth = getAuthData()!;
    const authenticatedUserId = auth.userID;
    
    // 1. Verify authentication - userId must match authenticated user
    if (req.userId !== authenticatedUserId) {
      throw new APIError(
        "permission_denied",
        "User ID does not match authenticated user"
      );
    }
    
    // 2. Basic validation
    if (!req.txHash || !req.walletAddress || !req.userId) {
      throw new APIError("invalid_argument", "Missing required fields");
    }
    
    if (req.amount <= 0) {
      throw new APIError("invalid_argument", "Amount must be positive");
    }
    
    if (req.depositId < 0) {
      throw new APIError("invalid_argument", "Invalid deposit ID");
    }
    
    // Validate txHash format
    if (!/^0x[a-fA-F0-9]{64}$/.test(req.txHash)) {
      throw new APIError("invalid_argument", "Invalid transaction hash format");
    }
    
    // Validate wallet address format
    if (!ethers.isAddress(req.walletAddress)) {
      throw new APIError("invalid_argument", "Invalid wallet address format");
    }
    
    // Validate userIdHash format
    if (!req.userIdHash || !/^0x[a-fA-F0-9]{64}$/.test(req.userIdHash)) {
      throw new APIError("invalid_argument", "Invalid userIdHash format");
    }
    
    // Verify userIdHash matches userId
    const expectedUserIdHash = ethers.keccak256(ethers.toUtf8Bytes(req.userId));
    if (req.userIdHash.toLowerCase() !== expectedUserIdHash.toLowerCase()) {
      throw new APIError("invalid_argument", "userIdHash does not match userId");
    }
    
    // 3. Check idempotency - verify deposit hasn't been processed before
    const existingDeposit = await db.queryRow<{ id: number }>`
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
    
    // 4. Verify wallet is linked to userId in contract
    const isWalletLinked = await verifyWalletLink(req.walletAddress, req.userId);
    if (!isWalletLinked) {
      throw new APIError(
        "failed_precondition",
        "Wallet is not linked to this user ID in the contract"
      );
    }
    
    // 5. Verify transaction on blockchain
    await verifyDepositTransaction(
      req.txHash,
      req.depositId,
      req.walletAddress,
      req.userId,
      req.amount,
      req.blockNumber,
      req.timestamp,
      req.nonce
    );
    
    // 6. Validate amount is within contract limits
    const MIN_DEPOSIT = 10 * 1_000_000; // 10 USDC
    const MAX_DEPOSIT = 1_000_000 * 1_000_000; // 1,000,000 USDC
    
    if (req.amount < MIN_DEPOSIT || req.amount > MAX_DEPOSIT) {
      throw new APIError(
        "invalid_argument",
        `Amount must be between ${MIN_DEPOSIT / 1_000_000} and ${MAX_DEPOSIT / 1_000_000} USDC`
      );
    }
    
    // 7. Convert amount from smallest units (6 decimals) to USDC
    const amountInUSDC = req.amount / 1_000_000;
    
    // 8. Update user balance and save deposit record in a transaction
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
          VALUES (${req.userId}, ${auth.email}, ${amountInUSDC}, ${req.walletAddress})
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
          ${req.walletAddress},
          ${req.amount},
          ${req.blockNumber},
          ${req.timestamp},
          ${req.nonce}
        )
      `;
      
      await tx.commit();
      
      return {
        success: true,
        message: "Deposit processed successfully",
        depositId: req.depositId,
      };
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }
);

