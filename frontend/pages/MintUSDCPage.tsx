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

const MANTLE_SEPOLIA_CHAIN_ID = 5003;
const MAX_MINT_PER_DAY = 10_000; // USDC
const MIN_MINT = 1; // USDC

export default function MintUSDCPage() {
  const [amount, setAmount] = useState<string>("");
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [mintLimit, setMintLimit] = useState<{
    mintedToday: number;
    remaining: number;
    limit: number;
  } | null>(null);
  const [isLoadingLimit, setIsLoadingLimit] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const backend = useBackend();
  const { user } = useUser();

  useEffect(() => {
    if (walletAddress) {
      loadMintLimit();
    }
  }, [walletAddress]);

  const checkMetaMask = () => {
    if (typeof window.ethereum === "undefined") {
      throw new Error("MetaMask is not installed. Please install the MetaMask extension.");
    }
    return window.ethereum;
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
        description: `Connected to ${address.slice(0, 6)}...${address.slice(-4)}`,
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
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load mint limit information",
      });
    } finally {
      setIsLoadingLimit(false);
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

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum < MIN_MINT || amountNum > MAX_MINT_PER_DAY) {
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: `Amount must be between ${MIN_MINT} and ${MAX_MINT_PER_DAY} USDC`,
      });
      return;
    }

    if (mintLimit && amountNum > mintLimit.remaining) {
      toast({
        variant: "destructive",
        title: "Daily Limit Exceeded",
        description: `You can only mint ${mintLimit.remaining.toFixed(2)} USDC remaining today`,
      });
      return;
    }

    try {
      setIsMinting(true);

      const result = await backend.user.mintUSDC({
        amount: amountNum,
        walletAddress: walletAddress,
      });

      toast({
        title: "Mint Successful!",
        description: result.message,
      });

      // Reset form
      setAmount("");

      // Reload mint limit
      await loadMintLimit();
    } catch (error: any) {
      console.error("Error minting USDC:", error);
      toast({
        variant: "destructive",
        title: "Mint Failed",
        description: error.message || "Failed to mint USDC. Please try again.",
      });
    } finally {
      setIsMinting(false);
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
                <h1 className="scroll-m-20 text-2xl font-bold tracking-tight">Mint Test USDC</h1>
                <p className="text-sm text-muted-foreground">Get test tokens for trading on Mantle Sepolia</p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </header>

        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="space-y-6">
            {/* Info Card */}
            <Alert>
              <Coins className="h-4 w-4" />
              <AlertTitle>Test Tokens</AlertTitle>
              <AlertDescription>
                Mint test USDC tokens (tUSDC) on Mantle Sepolia Testnet. You can mint up to {MAX_MINT_PER_DAY.toLocaleString()} USDC per day per wallet.
                These tokens can be used for testing deposits and trading on the platform.
              </AlertDescription>
            </Alert>

            {/* Wallet Connection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Wallet Connection
                </CardTitle>
                <CardDescription>Connect your wallet to mint test USDC tokens</CardDescription>
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
                  <div className="space-y-2">
                    <div className="rounded-md bg-muted p-3">
                      <p className="text-sm text-muted-foreground mb-1">Connected Wallet:</p>
                      <p className="font-mono text-sm break-all">{walletAddress}</p>
                    </div>
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
                      {mintLimit.remaining === 0 && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Daily Limit Reached</AlertTitle>
                          <AlertDescription>
                            You have reached your daily mint limit. Please try again tomorrow.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            )}

            {/* Mint Form */}
            {walletAddress && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Coins className="h-5 w-5" />
                    Mint USDC
                  </CardTitle>
                  <CardDescription>
                    Enter the amount of USDC you want to mint (max {MAX_MINT_PER_DAY.toLocaleString()} USDC per day)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount (USDC)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min={MIN_MINT}
                      max={MAX_MINT_PER_DAY}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder={`Min ${MIN_MINT}, Max ${MAX_MINT_PER_DAY.toLocaleString()} USDC`}
                      disabled={isMinting || (mintLimit?.remaining ?? MAX_MINT_PER_DAY) === 0}
                    />
                    {mintLimit && (
                      <p className="text-xs text-muted-foreground">
                        You can mint up to {Math.min(mintLimit.remaining, MAX_MINT_PER_DAY).toFixed(2)} USDC
                      </p>
                    )}
                  </div>

                  <Button
                    onClick={handleMint}
                    disabled={isMinting || !amount || (mintLimit?.remaining ?? MAX_MINT_PER_DAY) === 0}
                    className="w-full"
                  >
                    {isMinting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Minting...
                      </>
                    ) : (
                      <>
                        <Coins className="h-4 w-4 mr-2" />
                        Mint USDC
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Instructions */}
            <Card>
              <CardHeader>
                <CardTitle>How to Use</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <ol className="list-decimal list-inside space-y-2">
                  <li>Connect your MetaMask wallet</li>
                  <li>Make sure you're on Mantle Sepolia Testnet (Chain ID: {MANTLE_SEPOLIA_CHAIN_ID})</li>
                  <li>Enter the amount of USDC you want to mint (1-{MAX_MINT_PER_DAY.toLocaleString()} USDC)</li>
                  <li>Click "Mint USDC" and wait for the transaction to complete</li>
                  <li>After minting, you can deposit these tokens using the Deposit button in the Dashboard</li>
                </ol>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

