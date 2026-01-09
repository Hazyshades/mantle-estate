import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Empty } from "@/components/ui/empty";
import { useToast } from "@/components/ui/use-toast";
import { useBackend } from "../lib/useBackend";
import { useUnitPreference } from "@/lib/useUnitPreference";
import type { Position } from "~backend/trading/get_positions";
import type { City } from "~backend/city/list";
import { TrendingDown, TrendingUp, X, Wallet } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface PositionsListProps {
  positions: Position[];
  cities: City[];
  onCloseComplete: () => void;
}

export default function PositionsList({ positions, cities, onCloseComplete }: PositionsListProps) {
  const [closingPositionId, setClosingPositionId] = useState<number | null>(null);
  const { toast } = useToast();
  const backend = useBackend();
  const navigate = useNavigate();
  const { convertFromSqft, getUnitLabelLower } = useUnitPreference();

  // Function to generate cityCode from city name and country (uses state code if available)
  const getCityCode = (cityName: string, country: string): string => {
    const parts = cityName.split(",");
    if (parts.length > 1) {
      // If comma exists, use state code (e.g., "Chicago, IL" -> "IL-CHI")
      const state = parts[1].trim();
      const cityNameOnly = parts[0].trim();
      const stateCode = state.length === 2 ? state.toUpperCase() : state.substring(0, 3).toUpperCase();
      const cityCode = cityNameOnly.substring(0, 3).toUpperCase();
      return `${stateCode}-${cityCode}`;
    }
    // If no comma, use country code
    const countryCode = country.substring(0, 2).toUpperCase();
    const cityNameOnly = cityName.split(",")[0].trim();
    const cityCode = cityNameOnly.substring(0, 3).toUpperCase();
    return `${countryCode}-${cityCode}`;
  };

  // Handler for position card click
  const handleCardClick = (position: Position) => {
    const city = cities.find(c => c.id === position.cityId);
    if (city) {
      const cityCode = getCityCode(city.name, city.country);
      navigate(`/home-value-index/${cityCode}`);
    }
  };

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
        <Card 
          key={position.id}
          className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-[1.01]"
          onClick={() => handleCardClick(position)}
          role="button"
          tabIndex={0}
          aria-label={`Open city details for ${position.cityName}`}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleCardClick(position);
            }
          }}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CardTitle className="scroll-m-20 text-2xl font-semibold tracking-tight">{position.cityName}</CardTitle>
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
                variant="destructive"
                size="default"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent click event bubbling
                  handleClose(position.id);
                }}
                disabled={closingPositionId === position.id}
                className="font-semibold"
              >
                <X className="h-4 w-4 mr-2" />
                {closingPositionId === position.id ? "Closing..." : "Close Position"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-sm leading-none font-medium text-muted-foreground">Margin Used</p>
                <p className="text-lg font-semibold">${position.marginRequired.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm leading-none font-medium text-muted-foreground">Entry Price</p>
                <p className="text-lg font-semibold">${position.entryPrice.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm leading-none font-medium text-muted-foreground">Current Price</p>
                <p className="text-lg font-semibold">${position.currentPrice.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm leading-none font-medium text-muted-foreground">Unrealized P&L</p>
                <p className={`text-lg font-semibold ${position.unrealizedPnl >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {position.unrealizedPnl >= 0 ? "+" : ""}${position.unrealizedPnl.toFixed(2)}
                  {position.marginRequired > 0 && (
                    <span className="ml-1">
                      ({position.unrealizedPnl >= 0 ? "+" : ""}{((position.unrealizedPnl / position.marginRequired) * 100).toFixed(2)}%)
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground ml-1">
                    (incl. ${position.estimatedClosingFee.toFixed(2)} fee)
                  </span>
                </p>
              </div>
            </div>
            <div className="mt-3 text-sm leading-none font-medium text-muted-foreground">
              Opened: {new Date(position.openedAt).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
