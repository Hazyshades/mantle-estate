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
import { Loader2, Coins, AlertCircle, CheckCircle2, ArrowLeft, Wallet, ArrowRight } from "lucide-react";
import { Separator } from "@/components/ui/separator";

// Contract addresses (from Deployed.md)
const TEST_USDC_ADDRESS = "0xE3854F6BF768Ba9d094E6654dC99CcB8142159a4"; // TestUSDC token address
const DEPOSIT_CONTRACT_ADDRESS = "0x31201F0A8E8Af4f43f417740badBBdbd33d29284";
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
];

export default function MintDepositPage() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState<string>("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);
  const [isWalletLinked, setIsWalletLinked] = useState<boolean | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<string | null>(null);
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

  const handleMint = async () => {
    if (!walletAddress) {
      toast({
        variant: "destructive",
        title: "Wallet Not Connected",
        description: "Please connect your wallet first",
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

      // Contract uses: keccak256(abi.encodePacked("Mantle Estate: Link wallet\nUserID: ", userId, "\nWallet: ", Strings.toHexString(msg.sender)))
      // Strings.toHexString formats as "0x" + lowercase hex (no checksum)
      const normalizedAddress = walletAddress.toLowerCase();
      const message = `Mantle Estate: Link wallet\nUserID: ${user.id}\nWallet: ${normalizedAddress}`;

      // Sign message
      const signature = await signer.signMessage(message);

      // Call linkWallet on contract
      const contract = new ethers.Contract(
        DEPOSIT_CONTRACT_ADDRESS,
        DEPOSIT_CONTRACT_ABI,
        signer
      );

      toast({
        title: "Confirmation",
        description: "Please confirm the message signature in MetaMask",
      });

      const tx = await contract.linkWallet(user.id, signature);
      await tx.wait();

      setIsWalletLinked(true);
      toast({
        title: "Wallet Linked",
        description: "Wallet successfully linked to your account",
      });
    } catch (error: any) {
      console.error("Error linking wallet:", error);
      toast({
        variant: "destructive",
        title: "Link Error",
        description: error.reason || error.message || "Failed to link wallet",
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

      // Call backend to process deposit
      const userIdHash = ethers.keccak256(ethers.toUtf8Bytes(user.id));

      await backend.user.processDeposit({
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
        description: `Deposit of ${amountNum} USDC processed`,
      });

      // Reload balance
      await loadUsdcBalance();

      // Move to complete step
      setStep("complete");
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

            {/* Step 1: Mint */}
            {walletAddress && step === "mint" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Coins className="h-5 w-5" />
                    Step 1: Mint USDC
                  </CardTitle>
                  <CardDescription>
                    Mint {MINT_AMOUNT.toLocaleString()} test USDC tokens to your wallet
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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
                    disabled={isMinting || (mintLimit?.remaining ?? MINT_AMOUNT) < MINT_AMOUNT}
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
                        Mint {MINT_AMOUNT.toLocaleString()} USDC
                      </>
                    )}
                  </Button>

                  {mintLimit && mintLimit.remaining < MINT_AMOUNT && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Insufficient Limit</AlertTitle>
                      <AlertDescription>
                        You can only mint {mintLimit.remaining.toFixed(2)} USDC today.
                        Try again tomorrow or reduce the amount.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Step 2: Deposit */}
            {walletAddress && isWalletLinked && step === "deposit" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    Step 2: Deposit USDC
                  </CardTitle>
                  <CardDescription>
                    Deposit USDC to the platform for trading
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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
                      Make sure you have enough USDC in your wallet balance
                    </p>
                  </div>

                  <Button
                    onClick={handleDeposit}
                    disabled={isDepositing || !depositAmount}
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
                        Make Deposit
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
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
                  <li>Mint {MINT_AMOUNT.toLocaleString()} USDC tokens</li>
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

