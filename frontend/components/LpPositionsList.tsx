import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useBackend } from "../lib/useBackend";
import LpWithdrawDialog from "./LpWithdrawDialog";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";

interface UserLpPosition {
  poolId: number;
  cityId: number;
  cityName: string;
  shares: number;
  depositedAmount: number;
  withdrawnAmount: number;
  currentValue: number;
  pricePerShare: number;
  profit: number;
  profitPercent: number;
}

interface LpPositionsListProps {
  positions: UserLpPosition[];
  onWithdrawComplete: () => void;
}

export default function LpPositionsList({
  positions,
  onWithdrawComplete,
}: LpPositionsListProps) {
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<UserLpPosition | null>(null);
  const { toast } = useToast();

  const handleWithdraw = (position: UserLpPosition) => {
    setSelectedPosition(position);
    setWithdrawDialogOpen(true);
  };

  if (positions.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">No liquidity pool positions found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {positions.map((position) => (
          <Card key={position.poolId} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{position.cityName}</CardTitle>
                  <p className="text-sm text-muted-foreground">Liquidity Pool Position</p>
                </div>
                <div className={`flex items-center gap-1 ${position.profit >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {position.profit >= 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  <span className="text-sm font-medium">
                    {position.profitPercent >= 0 ? "+" : ""}
                    {position.profitPercent.toFixed(2)}%
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Shares</p>
                  <p className="text-lg font-semibold">{position.shares.toFixed(4)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Value</p>
                  <p className="text-lg font-semibold">
                    ${position.currentValue.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Deposited</p>
                  <p className="text-sm font-medium">
                    ${position.depositedAmount.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Withdrawn</p>
                  <p className="text-sm font-medium">
                    ${position.withdrawnAmount.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Profit/Loss</p>
                  <p className={`text-sm font-medium ${position.profit >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {position.profit >= 0 ? "+" : ""}
                    ${position.profit.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Price per Share</p>
                  <p className="text-sm font-medium">
                    ${position.pricePerShare.toFixed(4)}
                  </p>
                </div>
              </div>

              <Button
                onClick={() => handleWithdraw(position)}
                className="w-full"
                variant="outline"
              >
                Withdraw
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedPosition && (
        <LpWithdrawDialog
          isOpen={withdrawDialogOpen}
          onClose={() => {
            setWithdrawDialogOpen(false);
            setSelectedPosition(null);
          }}
          poolId={selectedPosition.poolId}
          availableShares={selectedPosition.shares}
          pricePerShare={selectedPosition.pricePerShare}
          cityName={selectedPosition.cityName}
          onWithdrawComplete={onWithdrawComplete}
        />
      )}
    </>
  );
}
