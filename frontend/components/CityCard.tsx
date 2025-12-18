import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import backend from "~backend/client";
import type { City } from "~backend/city/list";
import type { PricePoint } from "~backend/city/price_history";
import PriceChartArea from "./PriceChartArea";
import TradeDialog from "./TradeDialog";
import { TrendingDown, TrendingUp } from "lucide-react";

interface CityCardProps {
  city: City;
  balance: number;
  onTradeComplete: () => void;
}

export default function CityCard({ city, balance, onTradeComplete }: CityCardProps) {
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [isTradeDialogOpen, setIsTradeDialogOpen] = useState(false);
  const [tradeType, setTradeType] = useState<"long" | "short">("long");
  const { toast } = useToast();

  useEffect(() => {
    loadPriceHistory();
  }, [city.id]);

  const loadPriceHistory = async () => {
    try {
      // Request 25 years of data to display history from 2000
      const response = await backend.city.getPriceHistory({ cityId: city.id, years: 25 });
      setPriceHistory(response.prices);
    } catch (error) {
      console.error("Error loading price history:", error);
    }
  };

  // Calculate price change: compare current price with oldest price in history
  const priceChange =
    priceHistory.length >= 2
      ? ((city.currentPriceUsd - priceHistory[0].price) / priceHistory[0].price) * 100
      : 0;

  const handleTrade = (type: "long" | "short") => {
    setTradeType(type);
    setIsTradeDialogOpen(true);
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">{city.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{city.country}</p>
            </div>
            <div className={`flex items-center gap-1 ${priceChange >= 0 ? "text-green-500" : "text-red-500"}`}>
              {priceChange >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              <span className="text-sm font-medium">{priceChange.toFixed(2)}%</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-lg font-semibold">${city.currentPriceUsd.toFixed(2)}</p>
            <p className="text-sm leading-none font-medium text-muted-foreground">per sqm</p>
          </div>

          {priceHistory.length > 0 && <PriceChartArea data={priceHistory} />}

          <div className="grid grid-cols-2 gap-2">
            <Button onClick={() => handleTrade("long")} className="w-full" variant="default">
              Buy Long
            </Button>
            <Button onClick={() => handleTrade("short")} className="w-full" variant="outline">
              Sell Short
            </Button>
          </div>
        </CardContent>
      </Card>

      <TradeDialog
        isOpen={isTradeDialogOpen}
        onClose={() => setIsTradeDialogOpen(false)}
        city={city}
        balance={balance}
        tradeType={tradeType}
        onTradeComplete={onTradeComplete}
      />
    </>
  );
}
