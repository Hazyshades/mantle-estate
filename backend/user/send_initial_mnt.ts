import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { ethers } from "ethers";
import { secret } from "encore.dev/config";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { cwd } from "process";

// Load .env file for local development
// Try root .env first, then backend/.env
function loadEnvFile() {
  const envPaths = [
    join(cwd(), ".env"),
    join(cwd(), "backend", ".env"),
  ];
  
  for (const envPath of envPaths) {
    if (existsSync(envPath)) {
      const envContent = readFileSync(envPath, "utf-8");
      const lines = envContent.split("\n");
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#")) {
          const [key, ...valueParts] = trimmed.split("=");
          if (key && valueParts.length > 0) {
            const value = valueParts.join("=").trim();
            // Remove quotes if present
            const cleanValue = value.replace(/^["']|["']$/g, "");
            if (!process.env[key]) {
              process.env[key] = cleanValue;
            }
          }
        }
      }
      break;
    }
  }
}

loadEnvFile();

// TestUSDC contract address - update this with your deployed contract address
const TEST_USDC_ADDRESS = "0x8136564cfec628dc62c963bad34ccc58d792aae3";
const MANTLE_SEPOLIA_CHAIN_ID = 5003;

// Secrets for blockchain interaction
const mantleRpcUrl = secret("MantleSepoliaRPCUrl");
const contractOwnerPrivateKey = secret("ContractOwnerPrivateKey");

// For local development: you can set private key directly here (NOT for production!)
// Remove this and use secrets in production!
const LOCAL_DEV_PRIVATE_KEY = process.env.CONTRACT_OWNER_PRIVATE_KEY || "";

// ABI for TestUSDC contract - only the function we need
const TEST_USDC_ABI = [
  "function sendInitialMNT(address recipient) external",
  "function sendInitialMNTBatch(address[] calldata recipients) external",
  "function hasClaimedInitialMNT(address) external view returns (bool)",
  "function initialMNTAmount() external view returns (uint256)",
  "function getMNTBalance() external view returns (uint256)",
];

interface SendInitialMNTRequest {
  recipientAddress: string; // Wallet address to send MNT to
}

interface SendInitialMNTResponse {
  success: boolean;
  message: string;
  txHash?: string;
  recipientAddress?: string;
  amount?: string;
}

/**
 * Send initial MNT to a user's wallet (owner only)
 * This allows sending MNT without the user needing gas
 */
export const sendInitialMNT = api<SendInitialMNTRequest, SendInitialMNTResponse>(
  { auth: true, expose: true, method: "POST", path: "/user/send-initial-mnt" },
  async (req) => {
    const auth = getAuthData()!;

    // Validate recipient address
    if (!req.recipientAddress || !ethers.isAddress(req.recipientAddress)) {
      throw APIError.invalidArgument("Invalid recipient address");
    }

    // Normalize address
    const recipientAddress = ethers.getAddress(req.recipientAddress);

    try {
      // Get RPC URL
      let rpcUrl: string;
      try {
        const secretValue = mantleRpcUrl();
        rpcUrl = secretValue || "https://rpc.sepolia.mantle.xyz";
      } catch {
        rpcUrl = "https://rpc.sepolia.mantle.xyz";
      }

      // Get private key - try secret first, then fallback to local dev key
      let privateKey: string;
      try {
        privateKey = contractOwnerPrivateKey();
        if (!privateKey || !privateKey.startsWith("0x")) {
          throw new Error("Invalid private key format");
        }
      } catch (error) {
        // Fallback to local dev key if secret is not set (for local development only)
        if (LOCAL_DEV_PRIVATE_KEY && LOCAL_DEV_PRIVATE_KEY.startsWith("0x")) {
          console.warn("⚠️  Using local dev private key. This should NOT be used in production!");
          privateKey = LOCAL_DEV_PRIVATE_KEY;
        } else {
          throw APIError.internal(
            "Contract owner private key not configured. Please set ContractOwnerPrivateKey secret or CONTRACT_OWNER_PRIVATE_KEY environment variable."
          );
        }
      }

      // Create provider and wallet
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const wallet = new ethers.Wallet(privateKey, provider);

      // Verify we're on the correct network
      const network = await provider.getNetwork();
      if (Number(network.chainId) !== MANTLE_SEPOLIA_CHAIN_ID) {
        throw APIError.failedPrecondition(
          `Wrong network. Expected chain ID ${MANTLE_SEPOLIA_CHAIN_ID}, got ${network.chainId}`
        );
      }

      // Verify wallet is the contract owner (optional check)
      const contract = new ethers.Contract(TEST_USDC_ADDRESS, TEST_USDC_ABI, wallet);
      
      // Check if recipient already claimed (optional - contract will handle this)
      try {
        const hasClaimed = await contract.hasClaimedInitialMNT(recipientAddress);
        if (hasClaimed) {
          console.log(`Address ${recipientAddress} already claimed initial MNT, but sending anyway...`);
        }
      } catch (error) {
        console.warn("Could not check claim status:", error);
      }

      // Get initial MNT amount from contract
      let initialAmount: bigint;
      try {
        initialAmount = await contract.initialMNTAmount();
      } catch (error) {
        throw APIError.internal("Could not get initial MNT amount from contract");
      }

      // Check contract MNT balance
      let contractBalance: bigint;
      try {
        contractBalance = await contract.getMNTBalance();
      } catch (error) {
        throw APIError.internal("Could not get contract MNT balance");
      }

      if (contractBalance < initialAmount) {
        throw APIError.resourceExhausted(
          `Insufficient MNT in contract. Contract has ${ethers.formatEther(contractBalance)} MNT, ` +
          `but needs ${ethers.formatEther(initialAmount)} MNT. Please deposit MNT first.`
        );
      }

      // Send initial MNT
      console.log(`Sending ${ethers.formatEther(initialAmount)} MNT to ${recipientAddress}...`);
      
      const tx = await contract.sendInitialMNT(recipientAddress);
      console.log(`Transaction sent: ${tx.hash}`);

      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      if (!receipt || receipt.status !== 1) {
        throw APIError.internal("Transaction failed");
      }

      console.log(`Transaction confirmed: ${receipt.hash}`);

      return {
        success: true,
        message: `Successfully sent ${ethers.formatEther(initialAmount)} MNT to ${recipientAddress}`,
        txHash: receipt.hash,
        recipientAddress: recipientAddress,
        amount: ethers.formatEther(initialAmount),
      };
    } catch (error: any) {
      console.error("Error sending initial MNT:", error);

      // Handle specific errors
      if (error instanceof APIError) {
        throw error;
      }

      // Check for common ethers errors
      if (error.code === "CALL_EXCEPTION") {
        throw APIError.internal(
          `Contract call failed: ${error.message || "Unknown error"}. Make sure contract is deployed and owner key is correct.`
        );
      }

      if (error.code === "INSUFFICIENT_FUNDS" || error.message?.includes("insufficient funds")) {
        throw APIError.resourceExhausted(
          "Insufficient funds in owner wallet to pay for gas. Please fund the owner wallet."
        );
      }

      throw APIError.internal(
        `Failed to send initial MNT: ${error.message || "Unknown error"}`
      );
    }
  }
);

interface SendInitialMNTBatchRequest {
  recipientAddresses: string[]; // Array of wallet addresses to send MNT to
}

interface SendInitialMNTBatchResponse {
  success: boolean;
  message: string;
  txHash?: string;
  recipients?: string[];
  totalAmount?: string;
}

/**
 * Send initial MNT to multiple users at once (owner only)
 * More efficient for bulk operations
 */
export const sendInitialMNTBatch = api<SendInitialMNTBatchRequest, SendInitialMNTBatchResponse>(
  { auth: true, expose: true, method: "POST", path: "/user/send-initial-mnt-batch" },
  async (req) => {
    const auth = getAuthData()!;

    // Validate recipient addresses
    if (!req.recipientAddresses || req.recipientAddresses.length === 0) {
      throw APIError.invalidArgument("Recipient addresses array cannot be empty");
    }

    if (req.recipientAddresses.length > 100) {
      throw APIError.invalidArgument("Cannot send to more than 100 addresses at once");
    }

    // Validate and normalize all addresses
    const recipientAddresses = req.recipientAddresses.map((addr, index) => {
      if (!addr || !ethers.isAddress(addr)) {
        throw APIError.invalidArgument(`Invalid address at index ${index}: ${addr}`);
      }
      return ethers.getAddress(addr);
    });

    try {
      // Get RPC URL
      let rpcUrl: string;
      try {
        const secretValue = mantleRpcUrl();
        rpcUrl = secretValue || "https://rpc.sepolia.mantle.xyz";
      } catch {
        rpcUrl = "https://rpc.sepolia.mantle.xyz";
      }

      // Get private key - try secret first, then fallback to local dev key
      let privateKey: string;
      try {
        privateKey = contractOwnerPrivateKey();
        if (!privateKey || !privateKey.startsWith("0x")) {
          throw new Error("Invalid private key format");
        }
      } catch (error) {
        // Fallback to local dev key if secret is not set (for local development only)
        if (LOCAL_DEV_PRIVATE_KEY && LOCAL_DEV_PRIVATE_KEY.startsWith("0x")) {
          console.warn("⚠️  Using local dev private key. This should NOT be used in production!");
          privateKey = LOCAL_DEV_PRIVATE_KEY;
        } else {
          throw APIError.internal(
            "Contract owner private key not configured. Please set ContractOwnerPrivateKey secret or CONTRACT_OWNER_PRIVATE_KEY environment variable."
          );
        }
      }

      // Create provider and wallet
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const wallet = new ethers.Wallet(privateKey, provider);

      // Verify we're on the correct network
      const network = await provider.getNetwork();
      if (Number(network.chainId) !== MANTLE_SEPOLIA_CHAIN_ID) {
        throw APIError.failedPrecondition(
          `Wrong network. Expected chain ID ${MANTLE_SEPOLIA_CHAIN_ID}, got ${network.chainId}`
        );
      }

      // Connect to contract
      const contract = new ethers.Contract(TEST_USDC_ADDRESS, TEST_USDC_ABI, wallet);

      // Get initial MNT amount from contract
      let initialAmount: bigint;
      try {
        initialAmount = await contract.initialMNTAmount();
      } catch (error) {
        throw APIError.internal("Could not get initial MNT amount from contract");
      }

      // Calculate total needed
      const totalNeeded = initialAmount * BigInt(recipientAddresses.length);

      // Check contract MNT balance
      let contractBalance: bigint;
      try {
        contractBalance = await contract.getMNTBalance();
      } catch (error) {
        throw APIError.internal("Could not get contract MNT balance");
      }

      if (contractBalance < totalNeeded) {
        throw APIError.resourceExhausted(
          `Insufficient MNT in contract. Contract has ${ethers.formatEther(contractBalance)} MNT, ` +
          `but needs ${ethers.formatEther(totalNeeded)} MNT for ${recipientAddresses.length} recipients. Please deposit MNT first.`
        );
      }

      // Send initial MNT batch
      console.log(
        `Sending ${ethers.formatEther(initialAmount)} MNT each to ${recipientAddresses.length} addresses...`
      );

      const tx = await contract.sendInitialMNTBatch(recipientAddresses);
      console.log(`Batch transaction sent: ${tx.hash}`);

      // Wait for transaction confirmation
      const receipt = await tx.wait();

      if (!receipt || receipt.status !== 1) {
        throw APIError.internal("Transaction failed");
      }

      console.log(`Batch transaction confirmed: ${receipt.hash}`);

      return {
        success: true,
        message: `Successfully sent ${ethers.formatEther(initialAmount)} MNT to ${recipientAddresses.length} addresses`,
        txHash: receipt.hash,
        recipients: recipientAddresses,
        totalAmount: ethers.formatEther(totalNeeded),
      };
    } catch (error: any) {
      console.error("Error sending initial MNT batch:", error);

      // Handle specific errors
      if (error instanceof APIError) {
        throw error;
      }

      // Check for common ethers errors
      if (error.code === "CALL_EXCEPTION") {
        throw APIError.internal(
          `Contract call failed: ${error.message || "Unknown error"}. Make sure contract is deployed and owner key is correct.`
        );
      }

      if (error.code === "INSUFFICIENT_FUNDS" || error.message?.includes("insufficient funds")) {
        throw APIError.resourceExhausted(
          "Insufficient funds in owner wallet to pay for gas. Please fund the owner wallet."
        );
      }

      throw APIError.internal(
        `Failed to send initial MNT batch: ${error.message || "Unknown error"}`
      );
    }
  }
);

