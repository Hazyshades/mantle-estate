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
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface LpWithdrawDialogProps {
  isOpen: boolean;
  onClose: () => void;
  poolId: number;
  availableShares: number;
  pricePerShare: number;
  cityName: string;
  onWithdrawComplete: () => void;
}

export default function LpWithdrawDialog({
  isOpen,
  onClose,
  poolId,
  availableShares,
  pricePerShare,
  cityName,
  onWithdrawComplete,
}: LpWithdrawDialogProps) {
  const [shares, setShares] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const backend = useBackend();

  useEffect(() => {
    if (isOpen) {
      setShares("");
      setError(null);
    }
  }, [isOpen]);

  const calculateAmount = (sharesToWithdraw: number): number => {
    return sharesToWithdraw * pricePerShare;
  };

  const handleWithdraw = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const sharesNum = parseFloat(shares);
      if (isNaN(sharesNum) || sharesNum <= 0) {
        throw new Error("Shares must be positive");
      }

      if (sharesNum > availableShares) {
        throw new Error("Insufficient shares");
      }

      const response = await backend.liquidityPools.withdraw({
        poolId,
        shares: sharesNum,
      });

      toast({
        title: "Withdrawal Successful!",
        description: `Withdrew ${sharesNum.toFixed(4)} shares, received ${response.amountWithdrawn.toFixed(2)} USDC`,
      });

      onWithdrawComplete();
      onClose();
    } catch (error: any) {
      console.error("Error withdrawing:", error);
      const errorMessage = error.message || "Error processing withdrawal";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Withdrawal Error",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const amountPreview = shares && !isNaN(parseFloat(shares)) && parseFloat(shares) > 0
    ? calculateAmount(parseFloat(shares))
    : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Withdraw from Liquidity Pool</DialogTitle>
          <DialogDescription>
            Withdraw shares from {cityName} liquidity pool.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="shares">Shares to Withdraw</Label>
            <Input
              id="shares"
              type="number"
              step="0.0001"
              min="0"
              max={availableShares}
              value={shares}
              onChange={(e) => setShares(e.target.value)}
              placeholder="Enter shares amount"
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Available shares: {availableShares.toFixed(4)}
            </p>
          </div>

          {amountPreview > 0 && (
            <div className="rounded-md bg-muted p-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">You will receive:</span>
                <span className="font-semibold">${amountPreview.toFixed(2)} USDC</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Price per share:</span>
                <span>${pricePerShare.toFixed(4)}</span>
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
              onClick={handleWithdraw}
              disabled={isLoading || !shares || parseFloat(shares) <= 0 || parseFloat(shares) > availableShares}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Withdraw"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
