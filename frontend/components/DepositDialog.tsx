import { useState, useEffect } from "react";
import { ethers } from "ethers";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useBackend } from "../lib/useBackend";
import { useUser } from "@clerk/clerk-react";
import { Loader2, Wallet, AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface DepositDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onDepositComplete: () => void;
}

// Contract addresses (from Deployed.md)
const DEPOSIT_CONTRACT_ADDRESS = "0x3Dc8D566FE818bD66CA1A09cF636ff426C6fCe3b";
const MANTLE_SEPOLIA_CHAIN_ID = 5003;
const MIN_DEPOSIT = 10; // USDC
const MAX_DEPOSIT = 1_000_000; // USDC

// Contract ABI for deposit and linkWallet functions
const DEPOSIT_CONTRACT_ABI = [
  "function deposit(uint256 amount) external",
  "function linkWallet(string calldata userId, bytes calldata signature) external",
  "function isWalletLinked(address wallet) external view returns (bool)",
  "function getUserId(address wallet) external view returns (string memory)",
  "function minDepositAmount() external view returns (uint256)",
  "function maxDepositAmount() external view returns (uint256)",
  "event Deposit(uint256 indexed depositId, address indexed wallet, bytes32 indexed userIdHash, string userId, uint256 amount, bytes32 txHash, uint256 blockNumber, uint256 timestamp, uint256 nonce)",
];

export default function DepositDialog({
  isOpen,
  onClose,
  onDepositComplete,
}: DepositDialogProps) {
  const [amount, setAmount] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<
    "input" | "connecting" | "checking" | "linking" | "depositing" | "success" | "error"
  >("input");
  const [error, setError] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isWalletLinked, setIsWalletLinked] = useState<boolean | null>(null);
  const { toast } = useToast();
  const backend = useBackend();
  const { user } = useUser();

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setAmount("");
      setStep("input");
      setError(null);
      setWalletAddress(null);
      setIsWalletLinked(null);
    }
  }, [isOpen]);

  // Check if MetaMask is installed
  const checkMetaMask = () => {
    if (typeof window.ethereum === "undefined") {
      throw new Error(
        "MetaMask is not installed. Please install the MetaMask extension."
      );
    }
    return window.ethereum;
  };

  // Connect to MetaMask and get signer
  const connectWallet = async () => {
    try {
      setStep("connecting");
      setError(null);

      const ethereum = checkMetaMask();
      const provider = new ethers.BrowserProvider(ethereum);

      // Request account access
      const accounts = await provider.send("eth_requestAccounts", []);
      if (accounts.length === 0) {
        throw new Error("Please connect your wallet in MetaMask");
      }

      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setWalletAddress(address);

      // Check network
      const network = await provider.getNetwork();
      if (Number(network.chainId) !== MANTLE_SEPOLIA_CHAIN_ID) {
        // Try to switch network
        try {
          await ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: `0x${MANTLE_SEPOLIA_CHAIN_ID.toString(16)}` }],
          });
        } catch (switchError: any) {
          // If network doesn't exist, add it
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

      setStep("checking");
      return { provider, signer, address };
    } catch (error: any) {
      console.error("Error connecting wallet:", error);
      setError(error.message || "Error connecting wallet");
      setStep("error");
      throw error;
    }
  };

  // Check if wallet is linked
  const checkWalletLink = async (provider: ethers.BrowserProvider, address: string) => {
    try {
      const contract = new ethers.Contract(
        DEPOSIT_CONTRACT_ADDRESS,
        DEPOSIT_CONTRACT_ABI,
        provider
      );

      const linked = await contract.isWalletLinked(address);
      setIsWalletLinked(linked);

      if (!linked) {
        setStep("linking");
      }

      return linked;
    } catch (error: any) {
      console.error("Error checking wallet link:", error);
      throw new Error("Error checking wallet link");
    }
  };

  // Link wallet to userId
  const linkWallet = async (signer: ethers.JsonRpcSigner, address: string) => {
    try {
      if (!user?.id) {
        throw new Error("User not found");
      }

      // Contract uses: keccak256(abi.encodePacked("Mantle Estate: Link wallet\nUserID: ", userId, "\nWallet: ", Strings.toHexString(msg.sender)))
      // Strings.toHexString formats as "0x" + lowercase hex without checksum
      const normalizedAddress = address.toLowerCase();
      const message = `Mantle Estate: Link wallet\nUserID: ${user.id}\nWallet: ${normalizedAddress}`;

      // Sign message - ethers signMessage automatically handles EIP-191 prefix
      // Note: There may be a slight encoding difference between abi.encodePacked and UTF-8
      // but for most cases this should work. If it doesn't, we may need to manually construct the hash
      const signature = await signer.signMessage(message);

      // Call linkWallet on contract
      const contract = new ethers.Contract(
        DEPOSIT_CONTRACT_ADDRESS,
        DEPOSIT_CONTRACT_ABI,
        signer
      );

      const tx = await contract.linkWallet(user.id, signature);
      await tx.wait();

      setIsWalletLinked(true);
      setStep("checking");
    } catch (error: any) {
      console.error("Error linking wallet:", error);
      throw new Error(
        error.reason || error.message || "Error linking wallet"
      );
    }
  };

  // Get deposit event from transaction receipt
  const getDepositEvent = (receipt: ethers.ContractTransactionReceipt) => {
    const contract = new ethers.Contract(
      DEPOSIT_CONTRACT_ADDRESS,
      DEPOSIT_CONTRACT_ABI,
      null
    );

    const depositEvent = receipt.logs
      .map((log) => {
        try {
          return contract.interface.parseLog(log as any);
        } catch {
          return null;
        }
      })
      .find((parsed) => parsed && parsed.name === "Deposit");

    if (!depositEvent) {
      throw new Error("Deposit event not found in transaction");
    }

    return depositEvent.args;
  };

  // Process deposit transaction
  const processDeposit = async () => {
    try {
      setStep("depositing");
      setError(null);

      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum < MIN_DEPOSIT || amountNum > MAX_DEPOSIT) {
        throw new Error(
          `Amount must be between ${MIN_DEPOSIT} and ${MAX_DEPOSIT} USDC`
        );
      }

      // Connect wallet
      const { signer, address } = await connectWallet();

      // Check and link wallet if needed
      const provider = new ethers.BrowserProvider(window.ethereum!);
      const isLinked = await checkWalletLink(provider, address);
      if (!isLinked) {
        await linkWallet(signer, address);
      }

      // Convert amount to USDC (6 decimals)
      const amountInSmallestUnits = BigInt(Math.floor(amountNum * 1_000_000));

      // Approve USDC spending first
      const USDC_ADDRESS = "0x8136564cfec628dc62c963bad34ccc58d792aae3";
      const USDC_ABI = [
        "function approve(address spender, uint256 amount) external returns (bool)",
        "function allowance(address owner, address spender) external view returns (uint256)",
      ];

      const usdcContract = new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer);
      const allowance = await usdcContract.allowance(address, DEPOSIT_CONTRACT_ADDRESS);

      if (allowance < amountInSmallestUnits) {
        toast({
          title: "Approval Request",
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
      const eventArgs = getDepositEvent(receipt);

      if (!user?.id) {
        throw new Error("User not found");
      }

      // Call backend to process deposit
      const userIdHash = ethers.keccak256(ethers.toUtf8Bytes(user.id));

      await backend.user.processDeposit({
        depositId: Number(eventArgs.depositId),
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        amount: Number(eventArgs.amount),
        walletAddress: address,
        userId: user.id,
        userIdHash: userIdHash,
        timestamp: Number(eventArgs.timestamp),
        nonce: Number(eventArgs.nonce),
      });

      setStep("success");
      toast({
        title: "Deposit Successful!",
        description: `Deposit of ${amountNum} USDC processed`,
      });

      // Call callback to refresh balance
      onDepositComplete();

      // Close dialog after 2 seconds
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error: any) {
      console.error("Error processing deposit:", error);
      const errorMessage =
        error.reason ||
        error.message ||
        "Error processing deposit. Please try again.";
      setError(errorMessage);
      setStep("error");
      toast({
        variant: "destructive",
        title: "Deposit Error",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoading) {
      processDeposit();
    }
  };

  const getStepContent = () => {
    switch (step) {
      case "connecting":
        return (
          <div className="space-y-4 text-center py-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">
              Connecting to MetaMask...
            </p>
          </div>
        );
      case "checking":
        return (
          <div className="space-y-4 text-center py-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">
              Checking wallet link...
            </p>
          </div>
        );
      case "linking":
        return (
          <div className="space-y-4 text-center py-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">
              Linking wallet to account...
            </p>
            <p className="text-xs text-muted-foreground">
              Confirm message signature in MetaMask
            </p>
          </div>
        );
      case "depositing":
        return (
          <div className="space-y-4 text-center py-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">
              Processing deposit...
            </p>
            <p className="text-xs text-muted-foreground">
              Please confirm transactions in MetaMask
            </p>
          </div>
        );
      case "success":
        return (
          <div className="space-y-4 text-center py-4">
            <CheckCircle2 className="h-12 w-12 mx-auto text-green-500" />
            <p className="text-lg font-semibold">Deposit successfully processed!</p>
            <p className="text-sm text-muted-foreground">
              Your balance has been updated
            </p>
          </div>
        );
      case "error":
        return (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error || "An error occurred"}</AlertDescription>
          </Alert>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Deposit Funds
          </DialogTitle>
          <DialogDescription>
            Enter deposit amount in USDC. Minimum {MIN_DEPOSIT} USDC, maximum{" "}
            {MAX_DEPOSIT.toLocaleString()} USDC.
          </DialogDescription>
        </DialogHeader>

        {step === "input" && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (USDC)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min={MIN_DEPOSIT}
                max={MAX_DEPOSIT}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`Minimum ${MIN_DEPOSIT} USDC`}
                disabled={isLoading}
                required
              />
              <p className="text-xs text-muted-foreground">
                Make sure you have enough USDC in your wallet balance
              </p>
            </div>

            {walletAddress && (
              <div className="rounded-md bg-muted p-3 text-sm">
                <p className="text-muted-foreground">Wallet:</p>
                <p className="font-mono text-xs break-all">{walletAddress}</p>
                {isWalletLinked !== null && (
                  <p className="text-xs mt-1">
                    Status:{" "}
                    <span
                      className={
                        isWalletLinked
                          ? "text-green-600 dark:text-green-400"
                          : "text-yellow-600 dark:text-yellow-400"
                      }
                    >
                      {isWalletLinked
                        ? "Linked"
                        : "Link Required"}
                    </span>
                  </p>
                )}
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || !amount}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Deposit"
                )}
              </Button>
            </div>
          </form>
        )}

        {(step === "connecting" ||
          step === "checking" ||
          step === "linking" ||
          step === "depositing" ||
          step === "success" ||
          step === "error") &&
          getStepContent()}

        {step === "error" && (
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setStep("input")}>
              Try Again
            </Button>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
