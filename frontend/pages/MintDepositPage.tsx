import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { useBackend } from "../lib/useBackend";
import { useUser } from "@clerk/clerk-react";
import { Sidebar } from "@/components/Sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Loader2, Coins, AlertCircle, CheckCircle2, ArrowLeft, Wallet } from "lucide-react";
import { Separator } from "@/components/ui/separator";

// Contract addresses (from Deployed.md)
const TEST_USDC_ADDRESS = "0x8136564cfec628dc62c963bad34ccc58d792aae3"; // TestUSDC token address
const DEPOSIT_CONTRACT_ADDRESS = "0x3Dc8D566FE818bD66CA1A09cF636ff426C6fCe3b";
const MANTLE_SEPOLIA_CHAIN_ID = 5003;
const MINT_AMOUNT = 10_000; // USDC
const MIN_DEPOSIT = 10; // USDC
const MAX_DEPOSIT = 1_000_000; // USDC

// Contract ABIs
const DEPOSIT_CONTRACT_ABI = [
  "function deposit(uint256 amount) external",
  "function linkWallet(string calldata userId, bytes calldata signature) external",
  "function isWalletLinked(address wallet) external view returns (bool)",
  "function getUserId(address wallet) external view returns (string memory)",
  "function minDepositAmount() external view returns (uint256)",
  "function maxDepositAmount() external view returns (uint256)",
  "event Deposit(uint256 indexed depositId, address indexed wallet, bytes32 indexed userIdHash, string userId, uint256 amount, bytes32 txHash, uint256 blockNumber, uint256 timestamp, uint256 nonce)",
];

const USDC_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external pure returns (uint8)",
];

const TEST_USDC_MINT_ABI = [
  "function mint(address to, uint256 amount) external",
  "function claimInitialMNT() external",
  "function hasClaimedInitialMNT(address account) external view returns (bool)",
  "function initialMNTAmount() external view returns (uint256)",
];

export default function MintDepositPage() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState<string>("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isClaimingMNT, setIsClaimingMNT] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);
  const [isWalletLinked, setIsWalletLinked] = useState<boolean | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<string | null>(null);
  const [hasClaimedMNT, setHasClaimedMNT] = useState<boolean | null>(null);
  const [mintLimit, setMintLimit] = useState<{
    mintedToday: number;
    remaining: number;
    limit: number;
  } | null>(null);
  const [isLoadingLimit, setIsLoadingLimit] = useState(false);
  const [step, setStep] = useState<"mint" | "deposit" | "complete">("mint");
  const navigate = useNavigate();
  const { toast } = useToast();
  const backend = useBackend();
  const { user } = useUser();

  useEffect(() => {
    if (walletAddress) {
      loadMintLimit();
      loadUsdcBalance();
      checkWalletLink();
      checkMNTClaimStatus();
    }
  }, [walletAddress]);

  const checkMetaMask = () => {
    if (typeof (window as any).ethereum === "undefined") {
      throw new Error("MetaMask is not installed. Please install the MetaMask extension.");
    }
    return (window as any).ethereum;
  };

  const connectWallet = async () => {
    try {
      setIsConnecting(true);
      const ethereum = checkMetaMask();
      const provider = new ethers.BrowserProvider(ethereum);

      const accounts = await provider.send("eth_requestAccounts", []);
      if (accounts.length === 0) {
        throw new Error("Please connect your wallet in MetaMask");
      }

      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      // Check network
      const network = await provider.getNetwork();
      if (Number(network.chainId) !== MANTLE_SEPOLIA_CHAIN_ID) {
        try {
          await ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: `0x${MANTLE_SEPOLIA_CHAIN_ID.toString(16)}` }],
          });
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            await ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: `0x${MANTLE_SEPOLIA_CHAIN_ID.toString(16)}`,
                  chainName: "Mantle Sepolia Testnet",
                  nativeCurrency: {
                    name: "MNT",
                    symbol: "MNT",
                    decimals: 18,
                  },
                  rpcUrls: ["https://rpc.sepolia.mantle.xyz"],
                  blockExplorerUrls: ["https://sepolia.mantlescan.xyz"],
                },
              ],
            });
          } else {
            throw switchError;
          }
        }
      }

      setWalletAddress(address);
      toast({
        title: "Wallet Connected",
        description: `Connected wallet ${address.slice(0, 6)}...${address.slice(-4)}`,
      });
    } catch (error: any) {
      console.error("Error connecting wallet:", error);
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: error.message || "Failed to connect wallet",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const loadMintLimit = async () => {
    if (!walletAddress) return;

    try {
      setIsLoadingLimit(true);
      const limit = await backend.user.getMintLimit({ walletAddress });
      setMintLimit(limit);
    } catch (error: any) {
      console.error("Error loading mint limit:", error);
    } finally {
      setIsLoadingLimit(false);
    }
  };

  const loadUsdcBalance = async () => {
    if (!walletAddress) return;

    try {
      const ethereum = checkMetaMask();
      const provider = new ethers.BrowserProvider(ethereum);
      const usdcContract = new ethers.Contract(TEST_USDC_ADDRESS, USDC_ABI, provider);
      const balance = await usdcContract.balanceOf(walletAddress);
      const decimals = await usdcContract.decimals();
      const balanceFormatted = ethers.formatUnits(balance, decimals);
      setUsdcBalance(balanceFormatted);
    } catch (error: any) {
      console.error("Error loading USDC balance:", error);
      setUsdcBalance(null);
    }
  };

  const checkWalletLink = async () => {
    if (!walletAddress) return;

    try {
      const ethereum = checkMetaMask();
      const provider = new ethers.BrowserProvider(ethereum);
      const contract = new ethers.Contract(
        DEPOSIT_CONTRACT_ADDRESS,
        DEPOSIT_CONTRACT_ABI,
        provider
      );
      const linked = await contract.isWalletLinked(walletAddress);
      setIsWalletLinked(linked);
    } catch (error: any) {
      console.error("Error checking wallet link:", error);
      setIsWalletLinked(null);
    }
  };

  const checkMNTClaimStatus = async () => {
    if (!walletAddress) return;

    try {
      const ethereum = checkMetaMask();
      const provider = new ethers.BrowserProvider(ethereum);
      const testUsdcContract = new ethers.Contract(
        TEST_USDC_ADDRESS,
        TEST_USDC_MINT_ABI,
        provider
      );
      const claimed = await testUsdcContract.hasClaimedInitialMNT(walletAddress);
      setHasClaimedMNT(claimed);
    } catch (error: any) {
      console.error("Error checking MNT claim status:", error);
      setHasClaimedMNT(null);
    }
  };

  const handleClaimMNT = async () => {
    if (!walletAddress) {
      toast({
        variant: "destructive",
        title: "Wallet Not Connected",
        description: "Please connect your wallet first",
      });
      return;
    }

    if (hasClaimedMNT) {
      toast({
        variant: "destructive",
        title: "Already Claimed",
        description: "You have already claimed initial MNT tokens",
      });
      return;
    }

    try {
      setIsClaimingMNT(true);

      toast({
        title: "Sending MNT...",
        description: "Requesting MNT tokens from server (no gas required!)",
      });

      // Call API to send MNT (gasless - no MetaMask needed!)
      const result = await backend.user.sendInitialMNT({
        recipientAddress: walletAddress,
      });

      // Update state immediately after successful API call
      setHasClaimedMNT(true);

      toast({
        title: "MNT Sent Successfully!",
        description: result.message || `You received ${result.amount} MNT tokens for gas fees`,
      });

      // Reload claim status to verify
      setTimeout(async () => {
        await checkMNTClaimStatus();
      }, 2000);
    } catch (error: any) {
      console.error("Error claiming MNT:", error);
      toast({
        variant: "destructive",
        title: "Claim Error",
        description: error.message || "Failed to claim MNT. Please try again.",
      });
    } finally {
      setIsClaimingMNT(false);
    }
  };

  const handleMint = async () => {
    if (!walletAddress) {
      toast({
        variant: "destructive",
        title: "Wallet Not Connected",
        description: "Please connect your wallet first",
      });
      return;
    }

    if (!hasClaimedMNT) {
      toast({
        variant: "destructive",
        title: "MNT Not Claimed",
        description: "Please claim MNT tokens first to cover gas fees",
      });
      return;
    }

    if (mintLimit && mintLimit.remaining < MINT_AMOUNT) {
      toast({
        variant: "destructive",
        title: "Daily Limit Exceeded",
        description: `You can only mint ${mintLimit.remaining.toFixed(2)} USDC today`,
      });
      return;
    }

    try {
      setIsMinting(true);

      // Check MetaMask
      const ethereum = checkMetaMask();
      const provider = new ethers.BrowserProvider(ethereum);
      const signer = await provider.getSigner();

      // Convert amount to smallest units (6 decimals)
      const amountInSmallestUnits = BigInt(Math.floor(MINT_AMOUNT * 1_000_000));

      // Create contract instance
      const usdcContract = new ethers.Contract(
        TEST_USDC_ADDRESS,
        TEST_USDC_MINT_ABI,
        signer
      );

      toast({
        title: "Confirmation Required",
        description: "Please confirm the mint transaction in MetaMask",
      });

      // Call mint function on contract
      const tx = await usdcContract.mint(walletAddress, amountInSmallestUnits);
      
      toast({
        title: "Transaction Sent",
        description: "Waiting for confirmation...",
      });

      // Wait for transaction to be mined
      const receipt = await tx.wait();

      if (!receipt || receipt.status !== 1) {
        throw new Error("Transaction failed");
      }

      // Send txHash to backend to record the mint
      const result = await backend.user.mintUSDC({
        txHash: receipt.hash,
        walletAddress: walletAddress,
      });

      toast({
        title: "Mint Successful!",
        description: result.message,
      });

      // Reload balance and limit
      await loadUsdcBalance();
      await loadMintLimit();

      // Move to deposit step
      setStep("deposit");
      setDepositAmount(MINT_AMOUNT.toString());
    } catch (error: any) {
      console.error("Error minting USDC:", error);
      toast({
        variant: "destructive",
        title: "Mint Error",
        description: error.reason || error.message || "Failed to mint USDC. Please try again.",
      });
    } finally {
      setIsMinting(false);
    }
  };

  const linkWallet = async () => {
    if (!walletAddress || !user?.id) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Wallet or user not found",
      });
      return;
    }

    try {
      const ethereum = checkMetaMask();
      const provider = new ethers.BrowserProvider(ethereum);
      const signer = await provider.getSigner();

      // Get the current signer address to ensure we're using the right wallet
      const currentSignerAddress = await signer.getAddress();
      
      // Verify that the connected wallet matches the signer
      if (currentSignerAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        throw new Error("Connected wallet address does not match signer address");
      }

      // Contract uses: keccak256(abi.encodePacked("Mantle Estate: Link wallet\nUserID: ", userId, "\nWallet: ", Strings.toHexString(msg.sender)))
      // Strings.toHexString(address) in OpenZeppelin returns "0x" + lowercase hex without checksum
      // Example: "0xb43e240f5dcf238e9e7a49cbad6e43087e0fc6fa"
      // We need to ensure the address format matches exactly
      // ethers.getAddress() normalizes the address, then we convert to lowercase to match Strings.toHexString()
      const normalizedAddress = ethers.getAddress(currentSignerAddress).toLowerCase();
      
      // Build message exactly as contract expects (with \n for newlines)
      // Contract: keccak256(abi.encodePacked("Mantle Estate: Link wallet\nUserID: ", userId, "\nWallet: ", Strings.toHexString(msg.sender)))
      // IMPORTANT: abi.encodePacked for strings just concatenates UTF-8 bytes
      // This is the same as string concatenation in JavaScript
      // But we need to ensure the address format matches Strings.toHexString() output (lowercase, with 0x)
      const message = `Mantle Estate: Link wallet\nUserID: ${user.id}\nWallet: ${normalizedAddress}`;

      console.log("=== Link Wallet Debug Info ===");
      console.log("Message to sign:", JSON.stringify(message)); // Use JSON.stringify to see exact bytes
      console.log("Message (raw):", message);
      console.log("Message bytes length:", new TextEncoder().encode(message).length);
      console.log("Signer address:", currentSignerAddress);
      console.log("Wallet address from state:", walletAddress);
      console.log("Normalized address:", normalizedAddress);
      console.log("User ID:", user.id);

      // Contract now uses standard Ethereum signed message format:
      // keccak256("\x19Ethereum Signed Message:\n" + len(message_bytes) + message_bytes)
      // This matches what signMessage() in ethers.js does automatically
      // So we can just use signMessage - it should work now!
      const signature = await signer.signMessage(message);
      
      console.log("Signature obtained:", signature);
      console.log("Signature length:", signature.length);
      
      // Verify the signature locally before calling the contract
      // This helps debug if the signature is correct
      try {
        const recoveredAddress = ethers.verifyMessage(message, signature);
        console.log("=== Signature Verification ===");
        console.log("Recovered address from signature:", recoveredAddress);
        console.log("Expected address (signer):", currentSignerAddress);
        console.log("Addresses match:", recoveredAddress.toLowerCase() === currentSignerAddress.toLowerCase());
        
        if (recoveredAddress.toLowerCase() !== currentSignerAddress.toLowerCase()) {
          console.error("❌ Signature verification FAILED!");
          throw new Error(`Signature verification failed. Recovered: ${recoveredAddress}, Expected: ${currentSignerAddress}`);
        }
        console.log("✓ Signature verified locally - should work in contract");
      } catch (verifyError: any) {
        console.error("Signature verification error:", verifyError);
        throw new Error(`Failed to verify signature: ${verifyError.message}`);
      }
      
      // Double-check: The address used in the message should match the signer
      // This is critical - if they don't match, contract will reject with InvalidSignature
      if (normalizedAddress.toLowerCase() !== currentSignerAddress.toLowerCase()) {
        throw new Error(`Address mismatch in message! Message has ${normalizedAddress}, but signer is ${currentSignerAddress}`);
      }

      // Final check: ensure the address in message matches what will be msg.sender in contract
      // This is CRITICAL - if they don't match, contract will reject with InvalidSignature
      if (normalizedAddress.toLowerCase() !== currentSignerAddress.toLowerCase()) {
        throw new Error(`FATAL: Address mismatch! Message has ${normalizedAddress}, but msg.sender will be ${currentSignerAddress}`);
      }

      // Call linkWallet on contract
      const contract = new ethers.Contract(
        DEPOSIT_CONTRACT_ADDRESS,
        DEPOSIT_CONTRACT_ABI,
        signer
      );

      // Check if wallet is already linked (before sending transaction)
      try {
        const isAlreadyLinked = await contract.isWalletLinked(currentSignerAddress);
        console.log("Wallet already linked?", isAlreadyLinked);
        if (isAlreadyLinked) {
          setIsWalletLinked(true);
          toast({
            title: "Wallet Already Linked",
            description: "This wallet is already linked to an account",
          });
          return;
        }
      } catch (checkError: any) {
        console.warn("Could not check wallet link status:", checkError);
        // Continue anyway
      }

      toast({
        title: "Confirmation",
        description: "Please confirm the transaction in MetaMask",
      });

      console.log("Calling contract.linkWallet with:");
      console.log("  userId:", user.id);
      console.log("  signature:", signature);
      console.log("  msg.sender will be:", currentSignerAddress);
      console.log("  address in message:", normalizedAddress);

      const tx = await contract.linkWallet(user.id, signature);
      console.log("Transaction sent, hash:", tx.hash);
      console.log("Waiting for confirmation...");
      const receipt = await tx.wait();
      
      if (!receipt || receipt.status !== 1) {
        throw new Error("Transaction failed");
      }
      
      console.log("Transaction confirmed:", receipt.transactionHash);

      setIsWalletLinked(true);
      toast({
        title: "Wallet Linked",
        description: "Wallet successfully linked to your account",
      });
    } catch (error: any) {
      console.error("Error linking wallet:", error);
      // Check if it's a specific contract error
      let errorMessage = "Failed to link wallet";
      if (error.data?.data) {
        const errorData = error.data.data;
        if (errorData === "0xb50f48f7") {
          errorMessage = "Wallet is already linked to an account";
        } else if (errorData === "0x8baa579f") {
          errorMessage = "Invalid signature. Please make sure you're signing with the correct wallet.";
        } else if (errorData === "0x900bb2c9") {
          errorMessage = "This signature has already been used. Please try again.";
        } else if (errorData === "0x044145c3") {
          errorMessage = "Invalid user ID";
        }
      }
      toast({
        variant: "destructive",
        title: "Link Error",
        description: error.reason || error.message || errorMessage,
      });
    }
  };

  const handleDeposit = async () => {
    if (!walletAddress) {
      toast({
        variant: "destructive",
        title: "Wallet Not Connected",
        description: "Please connect your wallet first",
      });
      return;
    }

    if (!isWalletLinked) {
      toast({
        variant: "destructive",
        title: "Wallet Not Linked",
        description: "Please link your wallet first",
      });
      return;
    }

    const amountNum = parseFloat(depositAmount);
    if (isNaN(amountNum) || amountNum < MIN_DEPOSIT || amountNum > MAX_DEPOSIT) {
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: `Amount must be between ${MIN_DEPOSIT} and ${MAX_DEPOSIT} USDC`,
      });
      return;
    }

    try {
      setIsDepositing(true);

      const ethereum = checkMetaMask();
      const provider = new ethers.BrowserProvider(ethereum);
      const signer = await provider.getSigner();

      // Convert amount to USDC (6 decimals)
      const amountInSmallestUnits = BigInt(Math.floor(amountNum * 1_000_000));

      // Approve USDC spending first
      const usdcContract = new ethers.Contract(TEST_USDC_ADDRESS, USDC_ABI, signer);
      const allowance = await usdcContract.allowance(walletAddress, DEPOSIT_CONTRACT_ADDRESS);

      if (allowance < amountInSmallestUnits) {
        toast({
          title: "Confirmation",
          description: "Please confirm the USDC approval transaction",
        });

        const approveTx = await usdcContract.approve(
          DEPOSIT_CONTRACT_ADDRESS,
          ethers.MaxUint256
        );
        await approveTx.wait();
      }

      // Call deposit function
      const contract = new ethers.Contract(
        DEPOSIT_CONTRACT_ADDRESS,
        DEPOSIT_CONTRACT_ABI,
        signer
      );

      toast({
        title: "Sending Transaction",
        description: "Please confirm the deposit transaction in MetaMask",
      });

      const tx = await contract.deposit(amountInSmallestUnits);
      const receipt = await tx.wait();

      if (!receipt) {
        throw new Error("Transaction was not confirmed");
      }

      // Get deposit event data
      const depositEvent = receipt.logs
        .map((log: any) => {
          try {
            return contract.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((parsed: any) => parsed && parsed.name === "Deposit");

      if (!depositEvent || !user?.id) {
        throw new Error("Deposit event not found");
      }

      // Call backend to process deposit and update user balance
      const userIdHash = ethers.keccak256(ethers.toUtf8Bytes(user.id));

      const result = await backend.user.processDeposit({
        depositId: Number(depositEvent.args.depositId),
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        amount: Number(depositEvent.args.amount),
        walletAddress: walletAddress,
        userId: user.id,
        userIdHash: userIdHash,
        timestamp: Number(depositEvent.args.timestamp),
        nonce: Number(depositEvent.args.nonce),
      });

      toast({
        title: "Deposit Successful!",
        description: `${result.message}. Your new balance: ${result.newBalance.toFixed(2)} USDC`,
      });

      // Reload wallet USDC balance
      await loadUsdcBalance();

      // Clear deposit amount field for next deposit
      setDepositAmount("");
    } catch (error: any) {
      console.error("Error processing deposit:", error);
      const errorMessage =
        error.reason ||
        error.message ||
        "Error processing deposit. Please try again.";
      toast({
        variant: "destructive",
        title: "Deposit Error",
        description: errorMessage,
      });
    } finally {
      setIsDepositing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Sidebar collapsed={false} />
      
      <div className="ml-64">
        <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur supports-[backdrop-filter]:backdrop-blur shadow-sm">
          <div className="container mx-auto px-4 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate("/markets")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="scroll-m-20 text-2xl font-bold tracking-tight">Mint & Deposit</h1>
                <p className="text-sm text-muted-foreground">Mint and deposit test USDC tokens</p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </header>

        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <div className="space-y-6">
            {/* Wallet Connection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Wallet Connection
                </CardTitle>
                <CardDescription>Connect your MetaMask wallet for operations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!walletAddress ? (
                  <Button onClick={connectWallet} disabled={isConnecting} className="w-full">
                    {isConnecting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Wallet className="h-4 w-4 mr-2" />
                        Connect Wallet
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div className="rounded-md bg-muted p-3">
                      <p className="text-sm text-muted-foreground mb-1">Connected Wallet:</p>
                      <p className="font-mono text-sm break-all">{walletAddress}</p>
                      {usdcBalance !== null && (
                        <p className="text-sm text-muted-foreground mt-2">
                          USDC Balance: <span className="font-semibold">{parseFloat(usdcBalance).toFixed(2)} USDC</span>
                        </p>
                      )}
                      {isWalletLinked !== null && (
                        <p className="text-xs mt-2">
                          Status:{" "}
                          <span
                            className={
                              isWalletLinked
                                ? "text-green-600 dark:text-green-400"
                                : "text-yellow-600 dark:text-yellow-400"
                            }
                          >
                            {isWalletLinked ? "Linked" : "Link Required"}
                          </span>
                        </p>
                      )}
                    </div>
                    {!isWalletLinked && (
                      <Button onClick={linkWallet} variant="outline" className="w-full">
                        Link Wallet to Account
                      </Button>
                    )}
                    <Button variant="outline" onClick={connectWallet} className="w-full">
                      Change Wallet
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Mint Limit Info */}
            {walletAddress && (
              <Card>
                <CardHeader>
                  <CardTitle>Daily Mint Limit</CardTitle>
                  <CardDescription>Your minting progress for today</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingLimit ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : mintLimit ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Minted Today:</span>
                          <span className="font-semibold">{mintLimit.mintedToday.toFixed(2)} USDC</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Remaining:</span>
                          <span className={`font-semibold ${mintLimit.remaining > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                            {mintLimit.remaining.toFixed(2)} USDC
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Daily Limit:</span>
                          <span className="font-semibold">{mintLimit.limit.toLocaleString()} USDC</span>
                        </div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(100, (mintLimit.mintedToday / mintLimit.limit) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            )}

            {/* Step 1: Mint MNT and USDC */}
            {walletAddress && step === "mint" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Coins className="h-5 w-5" />
                    Step 1: Mint MNT & USDC
                  </CardTitle>
                  <CardDescription>
                    First claim MNT for gas, then mint test USDC tokens
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* MNT Claim Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">1. Claim Initial MNT</h3>
                        <p className="text-sm text-muted-foreground">
                          Get MNT tokens for gas fees (one-time per address, no gas required!)
                        </p>
                      </div>
                      {hasClaimedMNT !== null && (
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            hasClaimedMNT
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          }`}
                        >
                          {hasClaimedMNT ? "Claimed" : "Not Claimed"}
                        </span>
                      )}
                    </div>

                    <Button
                      onClick={handleClaimMNT}
                      disabled={isClaimingMNT || hasClaimedMNT === true}
                      className="w-full"
                      size="lg"
                      variant={hasClaimedMNT ? "outline" : "default"}
                    >
                      {isClaimingMNT ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Claiming MNT...
                        </>
                      ) : hasClaimedMNT ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          MNT Already Claimed
                        </>
                      ) : (
                        <>
                          <Coins className="h-4 w-4 mr-2" />
                          Claim Initial MNT
                        </>
                      )}
                    </Button>

                    {hasClaimedMNT && (
                      <Alert>
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertTitle>MNT Claimed</AlertTitle>
                        <AlertDescription>
                          You have already claimed initial MNT tokens. You can proceed to mint USDC.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  <Separator />

                  {/* USDC Mint Section */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-1">2. Mint tUSDC</h3>
                      <p className="text-sm text-muted-foreground">
                        Mint {MINT_AMOUNT.toLocaleString()} test USDC tokens to your wallet
                      </p>
                    </div>

                    <Alert>
                      <Coins className="h-4 w-4" />
                      <AlertTitle>Mint Test Tokens</AlertTitle>
                      <AlertDescription>
                        You will receive {MINT_AMOUNT.toLocaleString()} test USDC tokens in your wallet.
                        These tokens can be used to deposit on the platform.
                      </AlertDescription>
                    </Alert>

                    <Button
                      onClick={handleMint}
                      disabled={
                        isMinting ||
                        hasClaimedMNT !== true ||
                        (mintLimit?.remaining ?? MINT_AMOUNT) < MINT_AMOUNT
                      }
                      className="w-full"
                      size="lg"
                    >
                      {isMinting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Minting...
                        </>
                      ) : (
                        <>
                          <Coins className="h-4 w-4 mr-2" />
                          Mint {MINT_AMOUNT.toLocaleString()} tUSDC
                        </>
                      )}
                    </Button>

                    {hasClaimedMNT !== true && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>MNT Required</AlertTitle>
                        <AlertDescription>
                          Please claim MNT tokens first to cover gas fees for minting (no gas required for claiming!).
                        </AlertDescription>
                      </Alert>
                    )}

                    {hasClaimedMNT === true && mintLimit && mintLimit.remaining < MINT_AMOUNT && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Insufficient Limit</AlertTitle>
                        <AlertDescription>
                          You can only mint {mintLimit.remaining.toFixed(2)} USDC today.
                          Try again tomorrow or reduce the amount.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Deposit Section - Always visible when wallet is linked */}
            {walletAddress && isWalletLinked && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    Deposit USDC
                  </CardTitle>
                  <CardDescription>
                    Deposit USDC tokens to the platform. Your balance will be updated after successful deposit.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {usdcBalance !== null && (
                    <div className="rounded-md bg-muted p-3">
                      <p className="text-sm text-muted-foreground mb-1">Wallet USDC Balance:</p>
                      <p className="font-semibold text-lg">{parseFloat(usdcBalance).toFixed(2)} USDC</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="depositAmount">Deposit Amount (USDC)</Label>
                    <Input
                      id="depositAmount"
                      type="number"
                      step="0.01"
                      min={MIN_DEPOSIT}
                      max={MAX_DEPOSIT}
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder={`Minimum ${MIN_DEPOSIT}, maximum ${MAX_DEPOSIT.toLocaleString()} USDC`}
                      disabled={isDepositing}
                    />
                    <p className="text-xs text-muted-foreground">
                      Make sure you have enough USDC in your wallet balance ({usdcBalance !== null ? `${parseFloat(usdcBalance).toFixed(2)} USDC available` : "checking..."})
                    </p>
                  </div>

                  <Button
                    onClick={handleDeposit}
                    disabled={isDepositing || !depositAmount || (usdcBalance !== null && parseFloat(depositAmount) > parseFloat(usdcBalance))}
                    className="w-full"
                    size="lg"
                  >
                    {isDepositing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Depositing...
                      </>
                    ) : (
                      <>
                        <Wallet className="h-4 w-4 mr-2" />
                        Deposit to Platform
                      </>
                    )}
                  </Button>

                  {usdcBalance !== null && depositAmount && parseFloat(depositAmount) > parseFloat(usdcBalance) && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Insufficient Balance</AlertTitle>
                      <AlertDescription>
                        You don't have enough USDC in your wallet. You have {parseFloat(usdcBalance).toFixed(2)} USDC, but trying to deposit {parseFloat(depositAmount).toFixed(2)} USDC.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}

            {walletAddress && !isWalletLinked && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Wallet Not Linked</AlertTitle>
                <AlertDescription>
                  Please link your wallet to your account before making a deposit.
                </AlertDescription>
              </Alert>
            )}

            {/* Step 3: Complete */}
            {step === "complete" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    Operation Complete!
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle>Success</AlertTitle>
                    <AlertDescription>
                      You have successfully minted and deposited. Now you can start trading on the platform!
                    </AlertDescription>
                  </Alert>

                  <div className="flex gap-2">
                    <Button onClick={() => navigate("/markets")} className="flex-1">
                      Go to Markets
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setStep("mint");
                        setDepositAmount("");
                      }}
                    >
                      Repeat
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Instructions */}
            <Card>
              <CardHeader>
                <CardTitle>Instructions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <ol className="list-decimal list-inside space-y-2">
                  <li>Connect your MetaMask wallet</li>
                  <li>Make sure you're on Mantle Sepolia Testnet (Chain ID: {MANTLE_SEPOLIA_CHAIN_ID})</li>
                  <li>Link your wallet to your account (if not already linked)</li>
                  <li>Claim initial MNT tokens for gas fees (one-time per address, no gas required!)</li>
                  <li>Mint {MINT_AMOUNT.toLocaleString()} tUSDC tokens</li>
                  <li>Deposit to the platform</li>
                  <li>Start trading!</li>
                </ol>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

