import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useBackend } from "../lib/useBackend";
import type { City } from "~backend/city/list";
import type { PricePoint } from "~backend/city/price_history";
import type { CityMetrics } from "~backend/city/get_metrics";
import backend from "~backend/client";
import { Building2, TrendingUp, TrendingDown, Wallet, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import PriceChartShadcn from "./PriceChartShadcn";

interface CityDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  city: City;
  balance: number;
  onTradeComplete: () => void;
}

type TimeRange = "1d" | "1w" | "1m" | "all";

export default function CityDetailModal({
  isOpen,
  onClose,
  city,
  balance,
  onTradeComplete,
}: CityDetailModalProps) {
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>("1w");
  const [cityMetrics, setCityMetrics] = useState<CityMetrics | null>(null);
  const [showIndexPrice, setShowIndexPrice] = useState(true);
  const [showMarketPrice, setShowMarketPrice] = useState(false);
  const [showFPU, setShowFPU] = useState(false);
  const [showVolume, setShowVolume] = useState(false);
  const [tradeType, setTradeType] = useState<"long" | "short">("long");
  const [amount, setAmount] = useState("");
  const [size, setSize] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const backendClient = useBackend();

  useEffect(() => {
    if (isOpen) {
      loadPriceHistory();
      loadCityMetrics();
    }
  }, [city.id, isOpen]);

  const loadPriceHistory = async () => {
    try {
      const response = await backend.city.getPriceHistory({ cityId: city.id, years: 25 });
      setPriceHistory(response.prices);
    } catch (error) {
      console.error("Error loading price history:", error);
    }
  };

  const loadCityMetrics = async () => {
    try {
      const response = await backend.city.getCityMetrics({ cityId: city.id });
      setCityMetrics(response.metrics);
    } catch (error) {
      console.error("Error loading city metrics:", error);
      // In case of error, use default values
      setCityMetrics({
        volume24h: 0,
        openInterest: 0,
        longOI: 0,
        shortOI: 0,
        longOIAvailable: 0,
        shortOIAvailable: 0,
      });
    }
  };

  // Helper function to aggregate data by day
  const aggregateByDay = (data: PricePoint[]): PricePoint[] => {
    const dailyData = new Map<string, {
      prices: number[];
      indexPrices: number[];
      marketPrices: number[];
      timestamps: Date[];
      fundingRates: number[];
    }>();

    data.forEach((point) => {
      const date = new Date(point.timestamp);
      const dayKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      
      if (!dailyData.has(dayKey)) {
        dailyData.set(dayKey, {
          prices: [],
          indexPrices: [],
          marketPrices: [],
          timestamps: [],
          fundingRates: [],
        });
      }
      
      const dayData = dailyData.get(dayKey)!;
      dayData.prices.push(point.price);
      dayData.indexPrices.push(point.indexPrice);
      dayData.marketPrices.push(point.marketPrice);
      dayData.timestamps.push(new Date(point.timestamp));
      dayData.fundingRates.push(point.fundingRate);
    });

    return Array.from(dailyData.entries())
      .map(([dayKey, data]) => {
        const avgPrice = data.prices.reduce((a, b) => a + b, 0) / data.prices.length;
        const avgIndexPrice = data.indexPrices.reduce((a, b) => a + b, 0) / data.indexPrices.length;
        const avgMarketPrice = data.marketPrices.reduce((a, b) => a + b, 0) / data.marketPrices.length;
        const avgFundingRate = data.fundingRates.reduce((a, b) => a + b, 0) / data.fundingRates.length;
        
        const lastTimestamp = data.timestamps.reduce((latest, current) => 
          current > latest ? current : latest
        );

        return {
          price: avgPrice,
          indexPrice: avgIndexPrice,
          marketPrice: avgMarketPrice,
          fundingRate: avgFundingRate,
          timestamp: lastTimestamp,
        };
      })
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  };

  // Filter data by selected time range
  const filteredPriceHistory = useMemo(() => {
    if (!priceHistory.length) return [];
    
    const now = new Date();
    let cutoffDate = new Date();
    let filtered: PricePoint[] = [];
    
    switch (timeRange) {
      case "1d":
        cutoffDate.setDate(now.getDate() - 1);
        filtered = priceHistory.filter((point) => new Date(point.timestamp) >= cutoffDate);
        break;
      case "1w":
        cutoffDate.setDate(now.getDate() - 7);
        filtered = priceHistory.filter((point) => new Date(point.timestamp) >= cutoffDate);
        // Aggregate by day for 1w
        return aggregateByDay(filtered);
      case "1m":
        cutoffDate.setMonth(now.getMonth() - 1);
        filtered = priceHistory.filter((point) => new Date(point.timestamp) >= cutoffDate);
        // Aggregate by day for 1m
        return aggregateByDay(filtered);
      case "all": {
        // Aggregate data by month: for each month, calculate average price
        const monthlyData = new Map<string, {
          prices: number[];
          indexPrices: number[];
          marketPrices: number[];
          timestamps: Date[];
          fundingRates: number[];
        }>();

        priceHistory.forEach((point) => {
          const date = new Date(point.timestamp);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          
          if (!monthlyData.has(monthKey)) {
            monthlyData.set(monthKey, {
              prices: [],
              indexPrices: [],
              marketPrices: [],
              timestamps: [],
              fundingRates: [],
            });
          }
          
          const monthData = monthlyData.get(monthKey)!;
          monthData.prices.push(point.price);
          monthData.indexPrices.push(point.indexPrice);
          monthData.marketPrices.push(point.marketPrice);
          monthData.timestamps.push(new Date(point.timestamp));
          monthData.fundingRates.push(point.fundingRate);
        });

        // Convert monthly aggregates to PricePoint array
        const aggregated: PricePoint[] = Array.from(monthlyData.entries())
          .map(([monthKey, data]) => {
            // Calculate averages
            const avgPrice = data.prices.reduce((a, b) => a + b, 0) / data.prices.length;
            const avgIndexPrice = data.indexPrices.reduce((a, b) => a + b, 0) / data.indexPrices.length;
            const avgMarketPrice = data.marketPrices.reduce((a, b) => a + b, 0) / data.marketPrices.length;
            const avgFundingRate = data.fundingRates.reduce((a, b) => a + b, 0) / data.fundingRates.length;
            
            // Use the last timestamp of the month as the representative timestamp
            const lastTimestamp = data.timestamps.reduce((latest, current) => 
              current > latest ? current : latest
            );

            return {
              price: avgPrice,
              indexPrice: avgIndexPrice,
              marketPrice: avgMarketPrice,
              fundingRate: avgFundingRate,
              timestamp: lastTimestamp,
            };
          })
          .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

        return aggregated;
      }
    }
    
    return filtered;
  }, [priceHistory, timeRange]);

  // Calculate price change over the week
  const weekAgoPrice = useMemo(() => {
    if (priceHistory.length === 0) return city.indexPriceUsd;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0); // Set to start of day for consistent comparison
    
    // Find the point closest to week ago (most recent point <= weekAgo)
    const weekAgoPoints = priceHistory.filter(
      (p) => new Date(p.timestamp).getTime() <= weekAgo.getTime()
    );
    
    if (weekAgoPoints.length === 0) {
      // If no points found before week ago, use the oldest available point
      return priceHistory[0]?.indexPrice || city.indexPriceUsd;
    }
    
    // Get the most recent point (last in filtered array since history is sorted ASC)
    const weekAgoPoint = weekAgoPoints[weekAgoPoints.length - 1];
    return weekAgoPoint?.indexPrice || city.indexPriceUsd;
  }, [priceHistory, city.indexPriceUsd]);

  const priceChange = city.indexPriceUsd - weekAgoPrice;
  const priceChangePercent = weekAgoPrice > 0 ? (priceChange / weekAgoPrice) * 100 : 0;

  // Use real data from API
  const marketPrice = city.marketPriceUsd;
  const indexPrice = city.indexPriceUsd;
  
  // Use real metrics from API
  const volume24h = cityMetrics?.volume24h || 0;
  const openInterest = cityMetrics?.openInterest || 0;
  const longOI = cityMetrics?.longOI || 0;
  const shortOI = cityMetrics?.shortOI || 0;
  const longOIAvailable = cityMetrics?.longOIAvailable || 0;
  const shortOIAvailable = cityMetrics?.shortOIAvailable || 0;

  // Format volume: show in millions if >= 1M, otherwise in thousands
  const formatVolume = (volume: number): string => {
    if (volume >= 1000000) {
      return `$${(volume / 1000000).toFixed(2)}M`;
    } else {
      return `$${(volume / 1000).toFixed(2)}K`;
    }
  };

  // Format data for chart
  const chartData = filteredPriceHistory.map((point) => ({
    timestamp: new Date(point.timestamp).getTime(),
    date: new Date(point.timestamp),
    indexPrice: point.indexPrice || point.price,
    marketPrice: point.marketPrice || point.price,
    fpu: (point.indexPrice || point.price) - (point.marketPrice || point.price),
    fundingRate: point.fundingRate || 0,
    volume: volume24h / filteredPriceHistory.length,
  }));

  const getDateLabel = (timestamp: Date) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    
    if (diffDays < 7) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    if (diffDays < 365) {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
    return date.toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" });
  };

  const handleTrade = async () => {
    if (!amount && !size) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Enter amount or position size",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const amountNum = amount ? parseFloat(amount) : parseFloat(size) * indexPrice;
      
      if (amountNum <= 0) {
        throw new Error("Amount must be positive");
      }

      const response = await backendClient.trading.openPosition({
        cityId: city.id,
        positionType: tradeType,
        amountUsd: amountNum,
        leverage: 1,
      });

      toast({
        title: "Position opened!",
        description: `${tradeType === "long" ? "Bought" : "Sold"} ${response.quantitySqm.toFixed(2)} sqm at $${response.entryPrice.toFixed(2)}/sqm`,
      });

      onTradeComplete();
      setAmount("");
      setSize("");
    } catch (error) {
      console.error("Trade error:", error);
      toast({
        variant: "destructive",
        title: "Trade error",
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format city name (e.g., "Austin, TX" -> "TX-AUS")
  const cityCode = useMemo(() => {
    const parts = city.name.split(",");
    if (parts.length > 1) {
      const state = parts[1].trim();
      const cityName = parts[0].trim();
      // Take first 2-3 characters of state and first 3 characters of city
      const stateCode = state.length === 2 ? state.toUpperCase() : state.substring(0, 3).toUpperCase();
      const cityCode = cityName.substring(0, 3).toUpperCase();
      return `${stateCode}-${cityCode}`;
    }
    // If no state, use first 2 characters of country and first 3 characters of city
    const countryCode = city.country.substring(0, 2).toUpperCase();
    const cityName = city.name.split(",")[0].trim();
    const cityCode = cityName.substring(0, 3).toUpperCase();
    return `${countryCode}-${cityCode}`;
  }, [city.name, city.country]);

  const amountNum = parseFloat(amount) || 0;
  const sizeNum = parseFloat(size) || 0;
  const calculatedSize = amountNum > 0 ? amountNum / indexPrice : sizeNum;
  const calculatedAmount = sizeNum > 0 ? sizeNum * indexPrice : amountNum;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto bg-slate-900 text-white border-slate-700">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400">Real Estate / {cityCode}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/20 p-3">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold">{city.name.split(",")[0]}</h2>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-bold">${indexPrice.toFixed(2)}</span>
                    <span className={`text-sm ${priceChange >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {priceChange >= 0 ? "+" : ""}${Math.abs(priceChange).toFixed(2)} ({priceChangePercent >= 0 ? "+" : ""}{priceChangePercent.toFixed(2)}%) past week
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="pricing" className="w-full">
            <TabsList className="bg-slate-800 border-slate-700">
              <TabsTrigger value="pricing" className="data-[state=active]:bg-slate-700">Pricing</TabsTrigger>
            </TabsList>

            <TabsContent value="pricing" className="space-y-6 mt-6">
              {/* Market metrics */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                  <div className="flex items-center gap-1 mb-1">
                    <p className="text-xs text-slate-400">Market Price</p>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-slate-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Real estate price from Zillow data (fair value)</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-lg font-bold">${marketPrice.toFixed(2)}</p>
                  <p className="text-xs text-slate-400">
                    Diff: {((indexPrice - marketPrice) / marketPrice * 100).toFixed(2)}%
                  </p>
                </div>
                <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                  <p className="text-xs text-slate-400 mb-1">24h Volume</p>
                  <p className="text-lg font-bold">{formatVolume(volume24h)}</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                  <p className="text-xs text-slate-400 mb-1">Open Interest</p>
                  <p className="text-lg font-bold">{formatVolume(openInterest)}</p>
                  <p className="text-xs text-slate-400">{((longOI / openInterest) * 100).toFixed(2)}% {((shortOI / openInterest) * 100).toFixed(2)}%</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                  <div className="flex items-center gap-1 mb-1">
                    <p className="text-xs text-slate-400">Funding Rate</p>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-slate-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Rate paid by majority side to minority side. Positive = longs pay shorts, Negative = shorts pay longs</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className={`text-lg font-bold ${city.fundingRate >= 0 ? "text-red-500" : "text-green-500"}`}>
                    {(city.fundingRate * 100).toFixed(4)}%
                  </p>
                  <p className="text-xs text-slate-400">
                    {city.fundingRate >= 0 ? "Longs pay" : "Shorts pay"}
                  </p>
                </div>
                <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                  <p className="text-xs text-slate-400 mb-1">OI Avail. Long</p>
                  <p className="text-lg font-bold">{formatVolume(longOIAvailable)}</p>
                  <p className="text-xs text-slate-400">
                    {longOIAvailable > 0 
                      ? formatVolume(longOIAvailable * 0.1)
                      : "N/A"}
                  </p>
                </div>
                <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                  <p className="text-xs text-slate-400 mb-1">OI Avail. Short</p>
                  <p className="text-lg font-bold">{formatVolume(shortOIAvailable)}</p>
                  <p className="text-xs text-slate-400">
                    {shortOIAvailable > 0 
                      ? formatVolume(shortOIAvailable * 1.3)
                      : "N/A"}
                  </p>
                </div>
              </div>

              {/* Checkboxes and time interval */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="index-price"
                    checked={showIndexPrice}
                    onCheckedChange={(checked) => setShowIndexPrice(checked === true)}
                  />
                  <label htmlFor="index-price" className="text-sm cursor-pointer">
                    Index Price ${indexPrice.toFixed(2)}
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="market-price"
                    checked={showMarketPrice}
                    onCheckedChange={(checked) => setShowMarketPrice(checked === true)}
                  />
                  <label htmlFor="market-price" className="text-sm cursor-pointer">
                    Market Price ${marketPrice.toFixed(2)}
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="fpu"
                    checked={showFPU}
                    onCheckedChange={(checked) => setShowFPU(checked === true)}
                  />
                  <label htmlFor="fpu" className="text-sm cursor-pointer flex items-center gap-1">
                    FPU {(indexPrice - marketPrice).toFixed(2)}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-slate-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Fair Price Uncertainty - difference between Index and Market price</p>
                      </TooltipContent>
                    </Tooltip>
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="volume"
                    checked={showVolume}
                    onCheckedChange={(checked) => setShowVolume(checked === true)}
                  />
                  <label htmlFor="volume" className="text-sm cursor-pointer">
                    Volume ${(volume24h / 1000).toFixed(1)}K
                  </label>
                </div>
                <div className="ml-auto flex gap-2">
                  {(["1d", "1w", "1m", "all"] as TimeRange[]).map((range) => (
                    <Button
                      key={range}
                      variant={timeRange === range ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTimeRange(range)}
                      className={timeRange === range ? "bg-primary" : "bg-slate-800 border-slate-700"}
                    >
                      {range === "all" ? "All" : range}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Chart */}
              <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                {filteredPriceHistory.length > 0 ? (
                  <PriceChartShadcn
                    data={filteredPriceHistory}
                    showIndexPrice={showIndexPrice}
                    showMarketPrice={showMarketPrice}
                    timeRange={timeRange}
                  />
                ) : (
                  <div className="h-96 flex items-center justify-center text-slate-400">
                    Loading data...
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Transaction panel */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex gap-2 mb-4">
              <Button
                variant={tradeType === "long" ? "default" : "outline"}
                onClick={() => setTradeType("long")}
                className={tradeType === "long" ? "bg-green-600 hover:bg-green-700" : "bg-slate-700 border-slate-600"}
              >
                Long
              </Button>
              <Button
                variant={tradeType === "short" ? "default" : "outline"}
                onClick={() => setTradeType("short")}
                className={tradeType === "short" ? "bg-red-600 hover:bg-red-700" : "bg-slate-700 border-slate-600"}
              >
                Short
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Max: ${balance.toFixed(2)}</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    if (e.target.value) {
                      setSize((parseFloat(e.target.value) / indexPrice).toFixed(2));
                    } else {
                      setSize("");
                    }
                  }}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div>
                <label className="text-sm text-slate-400 mb-1 block">Size: {calculatedSize.toFixed(2)}</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={size}
                  onChange={(e) => {
                    setSize(e.target.value);
                    if (e.target.value) {
                      setAmount((parseFloat(e.target.value) * indexPrice).toFixed(2));
                    } else {
                      setAmount("");
                    }
                  }}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div className="space-y-2 pt-4 border-t border-slate-700">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Est. Fill Price</span>
                  <span className="text-white">--</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Est. Fill Price</span>
                  <span className="text-white">--</span>
                </div>
              </div>

              <Button
                onClick={handleTrade}
                disabled={isSubmitting || (!amount && !size)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Wallet className="h-4 w-4 mr-2" />
                {isSubmitting ? "Processing..." : "Connect Wallet"}
              </Button>

              <p className="text-xs text-center text-slate-400">Slippage 2.00%</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}



