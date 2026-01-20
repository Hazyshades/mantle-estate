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
import { useWallet } from "../lib/useWallet";
import { useUser } from "@clerk/clerk-react";
import { Sidebar } from "@/components/Sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Loader2, ArrowDown, AlertCircle, CheckCircle2, ArrowLeft, Wallet, TrendingUp, TrendingDown } from "lucide-react";

// Contract addresses (from Deployed.md)
const DEPOSIT_CONTRACT_ADDRESS = "0x54fDDAbe007fa60cA84d1DeA27E6400c99E290ca";
const MANTLE_SEPOLIA_CHAIN_ID = 5003;
const MIN_WITHDRAW = 10; // tUSDC

// Contract ABIs
const DEPOSIT_CONTRACT_ABI = [
  "function withdraw(uint256 amount) external",
  "function linkWallet(string calldata userId, bytes calldata signature) external",
  "function isWalletLinked(address wallet) external view returns (bool)",
  "function getUserId(address wallet) external view returns (string memory)",
  "function minDepositAmount() external view returns (uint256)",
  "function getContractBalance() external view returns (uint256)",
  "event Withdraw(uint256 indexed withdrawId, address indexed wallet, bytes32 indexed userIdHash, string userId, uint256 amount, bytes32 txHash, uint256 blockNumber, uint256 timestamp, uint256 nonce)",
  // Custom errors
  "error InsufficientBalance()",
  "error InvalidWithdrawAmount()",
  "error WalletNotLinked()",
  "error TransactionAlreadyProcessed()",
];

export default function WithdrawPage() {
  const { walletAddress, isConnecting, connectWallet, checkMetaMask } = useWallet();
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isWalletLinked, setIsWalletLinked] = useState<boolean | null>(null);
  const [platformBalance, setPlatformBalance] = useState<number | null>(null);
  const [contractBalance, setContractBalance] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    totalDeposits: number;
    totalWithdrawals: number;
    totalPnl: number;
    currentBalance: number;
  } | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const backend = useBackend();
  const { user } = useUser();

  useEffect(() => {
    if (user) {
      loadBalance();
      loadStats();
    }
  }, [user]);

  useEffect(() => {
    if (walletAddress) {
      checkWalletLink();
      loadContractBalance();
    }
  }, [walletAddress]);


  const loadBalance = async () => {
    try {
      const response = await backend.user.getBalance();
      setPlatformBalance(response.balance);
    } catch (error: any) {
      console.error("Error loading balance:", error);
      setPlatformBalance(null);
    }
  };

  const loadContractBalance = async () => {
    if (!walletAddress) return;

    try {
      const ethereum = checkMetaMask();
      const provider = new ethers.BrowserProvider(ethereum);
      const contract = new ethers.Contract(
        DEPOSIT_CONTRACT_ADDRESS,
        DEPOSIT_CONTRACT_ABI,
        provider
      );
      const balance = await contract.getContractBalance();
      const balanceFormatted = ethers.formatUnits(balance, 6);
      setContractBalance(balanceFormatted);
    } catch (error: any) {
      console.error("Error loading contract balance:", error);
      setContractBalance(null);
    }
  };

  const loadStats = async () => {
    try {
      // Get transactions to calculate PnL
      const transactionsRes = await backend.trading.getTransactions();
      const transactions = transactionsRes.transactions;

      // Calculate total PnL from closed positions
      const totalPnl = transactions
        .filter((t) => t.pnl !== null)
        .reduce((sum, t) => sum + (t.pnl || 0), 0);

      // Get deposits and withdrawals from backend (if we add those endpoints)
      // For now, we'll use the balance to estimate
      // You might need to add API endpoints to get total deposits/withdrawals

      setStats({
        totalDeposits: platformBalance || 0,
        totalWithdrawals: 0,
        totalPnl,
        currentBalance: platformBalance || 0,
      });
    } catch (error: any) {
      console.error("Error loading stats:", error);
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

      const currentSignerAddress = await signer.getAddress();
      if (currentSignerAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        throw new Error("Connected wallet address does not match signer address");
      }

      const normalizedAddress = ethers.getAddress(currentSignerAddress).toLowerCase();
      const message = `Mantle Estate: Link wallet\nUserID: ${user.id}\nWallet: ${normalizedAddress}`;

      const signature = await signer.signMessage(message);

      // Verify the signature locally
      const recoveredAddress = ethers.verifyMessage(message, signature);
      if (recoveredAddress.toLowerCase() !== currentSignerAddress.toLowerCase()) {
        throw new Error("Signature verification failed");
      }

      const contract = new ethers.Contract(
        DEPOSIT_CONTRACT_ADDRESS,
        DEPOSIT_CONTRACT_ABI,
        signer
      );

      // Check if wallet is already linked
      try {
        const isAlreadyLinked = await contract.isWalletLinked(currentSignerAddress);
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
      }

      toast({
        title: "Confirmation",
        description: "Please confirm the transaction in MetaMask",
      });

      const tx = await contract.linkWallet(user.id, signature);
      const receipt = await tx.wait();

      if (!receipt || receipt.status !== 1) {
        throw new Error("Transaction failed");
      }

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

  const handleWithdraw = async () => {
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

    if (!platformBalance) {
      toast({
        variant: "destructive",
        title: "Balance Not Loaded",
        description: "Please wait for balance to load",
      });
      return;
    }

    const amountNum = parseFloat(withdrawAmount);
    if (isNaN(amountNum) || amountNum < MIN_WITHDRAW) {
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: `Amount must be at least ${MIN_WITHDRAW} tUSDC`,
      });
      return;
    }

    if (amountNum > platformBalance) {
      toast({
        variant: "destructive",
        title: "Insufficient Balance",
        description: `You have ${platformBalance.toFixed(2)} tUSDC, but trying to withdraw ${amountNum.toFixed(2)} tUSDC`,
      });
      return;
    }

    // Create contract interface for error decoding (available in catch block)
    const contractInterface = new ethers.Interface(DEPOSIT_CONTRACT_ABI);

    try {
      setIsWithdrawing(true);

      const ethereum = checkMetaMask();
      const provider = new ethers.BrowserProvider(ethereum);
      const signer = await provider.getSigner();

      // Convert amount to tUSDC (6 decimals)
      const amountInSmallestUnits = BigInt(Math.floor(amountNum * 1_000_000));
      
      // Call withdraw function
      const contract = new ethers.Contract(
        DEPOSIT_CONTRACT_ADDRESS,
        DEPOSIT_CONTRACT_ABI,
        signer
      );

      // Check contract balance before attempting withdrawal
      const contractBalance = await contract.getContractBalance();
      const contractBalanceFormatted = parseFloat(ethers.formatUnits(contractBalance, 6));
      
      if (amountNum > contractBalanceFormatted) {
        toast({
          variant: "destructive",
          title: "Insufficient Contract Balance",
          description: `Contract has only ${contractBalanceFormatted.toFixed(2)} tUSDC available, but you're trying to withdraw ${amountNum.toFixed(2)} tUSDC. Please contact support.`,
        });
        setIsWithdrawing(false);
        return;
      }

      toast({
        title: "Sending Transaction",
        description: "Please confirm the withdrawal transaction in MetaMask",
      });

      const tx = await contract.withdraw(amountInSmallestUnits);
      const receipt = await tx.wait();

      if (!receipt) {
        throw new Error("Transaction was not confirmed");
      }

      // Get withdraw event data
      const withdrawEvent = receipt.logs
        .map((log: any) => {
          try {
            return contract.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((parsed: any) => parsed && parsed.name === "Withdraw");

      if (!withdrawEvent || !user?.id) {
        throw new Error("Withdraw event not found");
      }

      // Call backend to process withdraw and update user balance
      const userIdHash = ethers.keccak256(ethers.toUtf8Bytes(user.id));

      const result = await backend.user.processWithdraw({
        withdrawId: Number(withdrawEvent.args.withdrawId),
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        amount: Number(withdrawEvent.args.amount),
        walletAddress: walletAddress,
        userId: user.id,
        userIdHash: userIdHash,
        timestamp: Number(withdrawEvent.args.timestamp),
        nonce: Number(withdrawEvent.args.nonce),
      });

      toast({
        title: "Withdrawal Successful!",
        description: `${result.message}. Your new balance: ${result.newBalance.toFixed(2)} tUSDC`,
      });

      // Reload balance and stats
      await loadBalance();
      await loadStats();
      await loadContractBalance();

      // Clear withdraw amount field
      setWithdrawAmount("");
    } catch (error: any) {
      console.error("Error processing withdrawal:", error);
      
      // Decode custom error if present
      let errorMessage = "Error processing withdrawal. Please try again.";
      
      if (error.data) {
        try {
          // Try to decode the error
          const errorData = error.data;
          
          // Check for known error selectors
          if (typeof errorData === "string") {
            if (errorData.startsWith("0xf4d678b8")) {
              errorMessage = "Contract has insufficient tUSDC balance. Please contact support or try again later.";
            } else if (errorData.startsWith("0xdb73cdf0")) {
              errorMessage = `Invalid withdrawal amount. Minimum withdrawal is ${MIN_WITHDRAW} tUSDC.`;
            } else if (errorData.startsWith("0xc5ff3d33")) {
              errorMessage = "Wallet is not linked to your account. Please link your wallet first.";
            } else if (errorData.startsWith("0xeb4156ad")) {
              errorMessage = "This transaction has already been processed.";
            }
          }
          
          // Try to parse using contract interface
          if (error.data) {
            try {
              const decoded = contractInterface.parseError(error.data);
              if (decoded) {
                if (decoded.name === "InsufficientBalance") {
                  errorMessage = "Contract has insufficient tUSDC balance. Please contact support or try again later.";
                } else if (decoded.name === "InvalidWithdrawAmount") {
                  errorMessage = `Invalid withdrawal amount. Minimum withdrawal is ${MIN_WITHDRAW} tUSDC.`;
                } else if (decoded.name === "WalletNotLinked") {
                  errorMessage = "Wallet is not linked to your account. Please link your wallet first.";
                } else if (decoded.name === "TransactionAlreadyProcessed") {
                  errorMessage = "This transaction has already been processed.";
                }
              }
            } catch (parseError) {
              // If parsing fails, use fallback error message
            }
          }
        } catch (decodeError) {
          // Fallback to generic error message
        }
      }
      
      // Fallback to error.reason or error.message if we couldn't decode
      if (error.reason && errorMessage === "Error processing withdrawal. Please try again.") {
        errorMessage = error.reason;
      } else if (error.message && errorMessage === "Error processing withdrawal. Please try again.") {
        errorMessage = error.message;
      }
      
      toast({
        variant: "destructive",
        title: "Withdrawal Error",
        description: errorMessage,
      });
    } finally {
      setIsWithdrawing(false);
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
                <h1 className="scroll-m-20 text-2xl font-bold tracking-tight">Withdraw Funds</h1>
                <p className="text-sm text-muted-foreground">Withdraw ttUSDC from your platform balance</p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </header>

        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <div className="space-y-6">
            {/* Statistics Card */}
            {stats && (
              <Card>
                <CardHeader>
                  <CardTitle>Trading Statistics</CardTitle>
                  <CardDescription>Your profit & loss summary</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-md bg-muted p-4">
                      <p className="text-sm text-muted-foreground mb-1">Current Balance</p>
                      <p className="text-2xl font-bold">{stats.currentBalance.toFixed(2)} tUSDC</p>
                    </div>
                    <div className={`rounded-md p-4 ${stats.totalPnl >= 0 ? 'bg-green-50 dark:bg-green-950/20' : 'bg-red-50 dark:bg-red-950/20'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        {stats.totalPnl >= 0 ? (
                          <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                        )}
                        <p className="text-sm text-muted-foreground">Total P&L</p>
                      </div>
                      <p className={`text-2xl font-bold ${stats.totalPnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {stats.totalPnl >= 0 ? '+' : ''}{stats.totalPnl.toFixed(2)} tUSDC
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-md bg-muted p-4">
                      <p className="text-sm text-muted-foreground mb-1">Total Deposits</p>
                      <p className="text-lg font-semibold">{stats.totalDeposits.toFixed(2)} tUSDC</p>
                    </div>
                    <div className="rounded-md bg-muted p-4">
                      <p className="text-sm text-muted-foreground mb-1">Total Withdrawals</p>
                      <p className="text-lg font-semibold">{stats.totalWithdrawals.toFixed(2)} tUSDC</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Wallet Connection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Wallet Connection
                </CardTitle>
                <CardDescription>Connect your MetaMask wallet for withdrawal</CardDescription>
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
                      {platformBalance !== null && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Platform Balance: <span className="font-semibold">{platformBalance.toFixed(2)} tUSDC</span>
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

            {/* Withdraw Section */}
            {walletAddress && isWalletLinked && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ArrowDown className="h-5 w-5" />
                    Withdraw tUSDC
                  </CardTitle>
                  <CardDescription>
                    Withdraw tUSDC tokens from your platform balance to your wallet
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {platformBalance !== null && (
                    <div className="rounded-md bg-muted p-3">
                      <p className="text-sm text-muted-foreground mb-1">Available Balance:</p>
                      <p className="font-semibold text-lg">{platformBalance.toFixed(2)} tUSDC</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="withdrawAmount">Withdraw Amount (tUSDC)</Label>
                    <Input
                      id="withdrawAmount"
                      type="number"
                      step="0.01"
                      min={MIN_WITHDRAW}
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder={`Minimum ${MIN_WITHDRAW} tUSDC`}
                      disabled={isWithdrawing}
                    />
                    <p className="text-xs text-muted-foreground">
                      Make sure you have enough balance in your platform account ({platformBalance !== null ? `${platformBalance.toFixed(2)} tUSDC available` : "checking..."})
                    </p>
                  </div>

                  <Button
                    onClick={handleWithdraw}
                    disabled={isWithdrawing || !withdrawAmount || (platformBalance !== null && parseFloat(withdrawAmount) > platformBalance)}
                    className="w-full"
                    size="lg"
                  >
                    {isWithdrawing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Withdrawing...
                      </>
                    ) : (
                      <>
                        <ArrowDown className="h-4 w-4 mr-2" />
                        Withdraw to Wallet
                      </>
                    )}
                  </Button>

                  {platformBalance !== null && withdrawAmount && parseFloat(withdrawAmount) > platformBalance && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Insufficient Balance</AlertTitle>
                      <AlertDescription>
                        You don't have enough tUSDC in your platform balance. You have {platformBalance.toFixed(2)} tUSDC, but trying to withdraw {parseFloat(withdrawAmount).toFixed(2)} tUSDC.
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
                  Please link your wallet to your account before making a withdrawal.
                </AlertDescription>
              </Alert>
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
                  <li>Enter the amount you want to withdraw (minimum {MIN_WITHDRAW} tUSDC)</li>
                  <li>Confirm the withdrawal transaction in MetaMask</li>
                  <li>Your tUSDC will be sent to your connected wallet</li>
                </ol>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}


