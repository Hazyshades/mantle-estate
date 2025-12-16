import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Empty } from "@/components/ui/empty";
import { useToast } from "@/components/ui/use-toast";
import { useBackend } from "../lib/useBackend";
import type { Position } from "~backend/trading/get_positions";
import { TrendingDown, TrendingUp, X, Wallet } from "lucide-react";
import { useState } from "react";

interface PositionsListProps {
  positions: Position[];
  onCloseComplete: () => void;
}

export default function PositionsList({ positions, onCloseComplete }: PositionsListProps) {
  const [closingPositionId, setClosingPositionId] = useState<number | null>(null);
  const { toast } = useToast();
  const backend = useBackend();

  const handleClose = async (positionId: number) => {
    setClosingPositionId(positionId);

    try {
      const response = await backend.trading.closePosition({ positionId });
      toast({
        title: "Position closed!",
        description: `P&L: ${response.pnl >= 0 ? "+" : ""}$${response.pnl.toFixed(2)}`,
      });
      onCloseComplete();
    } catch (error) {
      console.error("Close position error:", error);
      toast({
        variant: "destructive",
        title: "Failed to close position",
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setClosingPositionId(null);
    }
  };

  if (positions.length === 0) {
    return (
      <Empty
        title="No open positions"
        description="Start trading to see your positions here. Open a long or short position on any market to get started."
        icon={<Wallet className="h-12 w-12 text-muted-foreground" />}
      />
    );
  }

  return (
    <div className="space-y-4">
      {positions.map((position) => (
        <Card key={position.id}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CardTitle className="text-lg">{position.cityName}</CardTitle>
                <Badge variant={position.positionType === "long" ? "default" : "secondary"}>
                  {position.positionType === "long" ? (
                    <>
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Long
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-3 w-3 mr-1" />
                      Short
                    </>
                  )}
                </Badge>
                {position.leverage > 1 && (
                  <Badge variant="outline" className="text-xs">
                    {position.leverage}x
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleClose(position.id)}
                disabled={closingPositionId === position.id}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Quantity</p>
                <p className="font-medium">{position.quantitySqm.toFixed(2)} sqm</p>
              </div>
              <div>
                <p className="text-muted-foreground">Entry Price</p>
                <p className="font-medium">${position.entryPrice.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Current Price</p>
                <p className="font-medium">${position.currentPrice.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Unrealized P&L</p>
                <p className={`font-bold ${position.unrealizedPnl >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {position.unrealizedPnl >= 0 ? "+" : ""}${position.unrealizedPnl.toFixed(2)}
                </p>
              </div>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              Opened: {new Date(position.openedAt).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
