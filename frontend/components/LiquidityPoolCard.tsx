import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useBackend } from "../lib/useBackend";
import type { City } from "~backend/city/list";
import LpDepositDialog from "./LpDepositDialog";
import LpWithdrawDialog from "./LpWithdrawDialog";
import { TrendingUp, TrendingDown } from "lucide-react";

interface LiquidityPoolCardProps {
  city: City;
  balance: number;
  onDepositComplete: () => void;
}

interface PoolInfo {
  poolId: number;
  cityId: number;
  cityName: string;
  totalLiquidity: number;
  totalShares: number;
  pricePerShare: number;
  cumulativePnl: number;
  totalFeesCollected: number;
}

export default function LiquidityPoolCard({
  city,
  balance,
  onDepositComplete,
}: LiquidityPoolCardProps) {
  const [poolInfo, setPoolInfo] = useState<PoolInfo | null>(null);
  const [isDepositDialogOpen, setIsDepositDialogOpen] = useState(false);
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  const [userPosition, setUserPosition] = useState<{ shares: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const backend = useBackend();

  useEffect(() => {
    loadPoolInfo();
    loadUserPosition();
    const interval = setInterval(() => {
      loadPoolInfo();
      loadUserPosition();
    }, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [city.id]);

  const loadUserPosition = async () => {
    try {
      const response = await backend.liquidityPools.getUserLp();
      const position = response.positions.find(p => p.cityId === city.id);
      setUserPosition(position ? { shares: position.shares } : null);
    } catch (error) {
      console.error("Error loading user position:", error);
    }
  };

  const loadPoolInfo = async () => {
    try {
      const response = await backend.liquidityPools.getPoolInfo({ cityId: city.id });
      setPoolInfo(response);
    } catch (error) {
      console.error("Error loading pool info:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDepositComplete = () => {
    loadPoolInfo();
    loadUserPosition();
    onDepositComplete();
  };

  const handleWithdrawComplete = () => {
    loadPoolInfo();
    loadUserPosition();
    onDepositComplete();
  };

  if (isLoading) {
    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Loading...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (!poolInfo) {
    return null;
  }

  const priceChange = poolInfo.pricePerShare > 1.0 
    ? ((poolInfo.pricePerShare - 1.0) / 1.0) * 100 
    : 0;

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">{city.name}</CardTitle>
              <p className="text-sm text-muted-foreground">Liquidity Pool</p>
            </div>
            <div className={`flex items-center gap-1 ${priceChange >= 0 ? "text-green-500" : "text-red-500"}`}>
              {priceChange >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              <span className="text-sm font-medium">{priceChange.toFixed(2)}%</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Liquidity</span>
              <span className="text-lg font-semibold">${poolInfo.totalLiquidity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Price per Share</span>
              <span className="text-lg font-semibold">${poolInfo.pricePerShare.toFixed(4)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Cumulative PnL</span>
              <span className={`text-sm font-medium ${poolInfo.cumulativePnl >= 0 ? "text-green-500" : "text-red-500"}`}>
                ${poolInfo.cumulativePnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Fees Collected</span>
              <span className="text-sm font-medium">${poolInfo.totalFeesCollected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button 
              onClick={() => setIsDepositDialogOpen(true)} 
              className="w-full" 
              variant="default"
            >
              Deposit
            </Button>
            <Button 
              onClick={() => setIsWithdrawDialogOpen(true)} 
              className="w-full" 
              variant="outline"
              disabled={!userPosition || userPosition.shares === 0}
            >
              Withdraw
            </Button>
          </div>
        </CardContent>
      </Card>

      <LpDepositDialog
        isOpen={isDepositDialogOpen}
        onClose={() => setIsDepositDialogOpen(false)}
        city={city}
        poolInfo={{
          poolId: poolInfo.poolId,
          pricePerShare: poolInfo.pricePerShare,
          totalLiquidity: poolInfo.totalLiquidity,
          totalShares: poolInfo.totalShares,
        }}
        balance={balance}
        onDepositComplete={handleDepositComplete}
      />

      {userPosition && userPosition.shares > 0 && poolInfo && (
        <LpWithdrawDialog
          isOpen={isWithdrawDialogOpen}
          onClose={() => setIsWithdrawDialogOpen(false)}
          poolId={poolInfo.poolId}
          availableShares={userPosition.shares}
          pricePerShare={poolInfo.pricePerShare}
          cityName={city.name}
          onWithdrawComplete={handleWithdrawComplete}
        />
      )}
    </>
  );
}
