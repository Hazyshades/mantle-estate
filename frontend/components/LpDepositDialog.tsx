import { useState, useEffect } from "react";
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
import type { City } from "~backend/city/list";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface LpDepositDialogProps {
  isOpen: boolean;
  onClose: () => void;
  city: City;
  poolInfo: {
    poolId: number;
    pricePerShare: number;
    totalLiquidity: number;
    totalShares: number;
  };
  balance: number;
  onDepositComplete: () => void;
}

const MIN_DEPOSIT = 10.0;

export default function LpDepositDialog({
  isOpen,
  onClose,
  city,
  poolInfo,
  balance,
  onDepositComplete,
}: LpDepositDialogProps) {
  const [amount, setAmount] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const backend = useBackend();

  useEffect(() => {
    if (isOpen) {
      setAmount("");
      setError(null);
    }
  }, [isOpen]);

  const calculateShares = (depositAmount: number): number => {
    if (poolInfo.totalShares === 0 || poolInfo.totalLiquidity === 0) {
      return depositAmount; // First deposit: 1 share = 1 USDC
    }
    // Calculate shares based on current price per share
    return depositAmount / poolInfo.pricePerShare;
  };

  const handleDeposit = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum < MIN_DEPOSIT) {
        throw new Error(`Minimum deposit is ${MIN_DEPOSIT} USDC`);
      }

      if (amountNum > balance) {
        throw new Error("Insufficient balance");
      }

      const response = await backend.liquidityPools.deposit({
        cityId: city.id,
        amount: amountNum,
      });

      toast({
        title: "Deposit Successful!",
        description: `Deposited ${amountNum} USDC, received ${response.sharesMinted.toFixed(4)} shares`,
      });

      onDepositComplete();
      onClose();
    } catch (error: any) {
      console.error("Error depositing:", error);
      const errorMessage = error.message || "Error processing deposit";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Deposit Error",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sharesPreview = amount && !isNaN(parseFloat(amount)) && parseFloat(amount) >= MIN_DEPOSIT
    ? calculateShares(parseFloat(amount))
    : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Deposit to Liquidity Pool</DialogTitle>
          <DialogDescription>
            Deposit USDC to {city.name} liquidity pool. Minimum {MIN_DEPOSIT} USDC.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (USDC)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min={MIN_DEPOSIT}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`Minimum ${MIN_DEPOSIT} USDC`}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Available balance: ${balance.toFixed(2)} USDC
            </p>
          </div>

          {sharesPreview > 0 && (
            <div className="rounded-md bg-muted p-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">You will receive:</span>
                <span className="font-semibold">{sharesPreview.toFixed(4)} shares</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Price per share:</span>
                <span>${poolInfo.pricePerShare.toFixed(4)}</span>
              </div>
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
            <Button
              onClick={handleDeposit}
              disabled={isLoading || !amount || parseFloat(amount) < MIN_DEPOSIT}
            >
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
