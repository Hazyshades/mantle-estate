import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useBackend } from "../lib/useBackend";
import { useUnitPreference } from "@/lib/useUnitPreference";
import type { City } from "~backend/city/list";

interface TradeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  city: City;
  balance: number;
  tradeType: "long" | "short";
  onTradeComplete: () => void;
}

export default function TradeDialog({
  isOpen,
  onClose,
  city,
  balance,
  tradeType,
  onTradeComplete,
}: TradeDialogProps) {
  const [amount, setAmount] = useState("");
  const [leverage, setLeverage] = useState("1");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const backend = useBackend();
  const { convertFromSqft, getUnitLabelLower } = useUnitPreference();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const amountNum = parseFloat(amount);
      const leverageNum = parseInt(leverage);

      if (amountNum <= 0) {
        throw new Error("Amount must be positive");
      }

      const fee = amountNum * leverageNum * 0.0001;
      const totalCost = amountNum + fee;

      if (totalCost > balance) {
        throw new Error("Insufficient balance");
      }

      const response = await backend.trading.openPosition({
        cityId: city.id,
        positionType: tradeType,
        amountUsd: amountNum,
        leverage: leverageNum,
      });

      const quantityInUnit = convertFromSqft(response.quantitySqm);
      const unitLabel = getUnitLabelLower();
      toast({
        title: "Position opened!",
        description: `${tradeType === "long" ? "Bought" : "Shorted"} ${quantityInUnit.toFixed(2)} ${unitLabel} at $${response.entryPrice.toFixed(2)}/${unitLabel}`,
      });

      onTradeComplete();
      onClose();
      setAmount("");
      setLeverage("1");
    } catch (error) {
      console.error("Trade error:", error);
      toast({
        variant: "destructive",
        title: "Trade failed",
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const amountNum = parseFloat(amount) || 0;
  const leverageNum = parseInt(leverage);
  const positionSize = (amountNum * leverageNum) / city.currentPriceUsd;
  const fee = amountNum * leverageNum * 0.001;
  const totalCost = amountNum + fee;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="scroll-m-20 text-2xl font-semibold tracking-tight">
            {tradeType === "long" ? "Buy Long" : "Sell Short"} - {city.name}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-xl">
            Current price: ${city.currentPriceUsd.toFixed(2)} per {getUnitLabelLower()}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Investment Amount (USD)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="100.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            <p className="text-sm leading-none font-medium text-muted-foreground">Available balance: ${balance.toFixed(2)}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="leverage">Leverage</Label>
            <Select value={leverage} onValueChange={setLeverage}>
              <SelectTrigger id="leverage">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1x (No leverage)</SelectItem>
                <SelectItem value="2">2x (Double position)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {amountNum > 0 && (
            <div className="rounded-lg bg-muted p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-sm leading-none font-medium text-muted-foreground">Position size:</span>
                <span className="text-lg font-semibold">{convertFromSqft(positionSize).toFixed(2)} {getUnitLabelLower()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm leading-none font-medium text-muted-foreground">Trading fee (0.1%):</span>
                <span className="text-lg font-semibold">${fee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2">
                <span className="text-lg font-semibold">Total cost:</span>
                <span className="text-lg font-semibold">${totalCost.toFixed(2)}</span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || amountNum <= 0}>
              {isSubmitting ? "Opening..." : tradeType === "long" ? "Buy Long" : "Sell Short"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
