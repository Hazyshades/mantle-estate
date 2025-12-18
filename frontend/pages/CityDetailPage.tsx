import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Slider } from "@/components/ui/slider";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/use-toast";
import { useBackend } from "../lib/useBackend";
import type { City } from "~backend/city/list";
import type { PricePoint } from "~backend/city/price_history";
import type { CityMetrics } from "~backend/city/get_metrics";
import backend from "~backend/client";
import { Building2, Wallet, ArrowLeft, Info, TrendingUp, TrendingDown } from "lucide-react";
import PriceUpdateTimer from "@/components/PriceUpdateTimer";
import PriceChartShadcn from "@/components/PriceChartShadcn";

type TimeRange = "1d" | "1w" | "1m" | "all";

export default function CityDetailPage() {
  const { cityCode } = useParams<{ cityCode: string }>();
  const navigate = useNavigate();
  const [city, setCity] = useState<City | null>(null);
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [cityMetrics, setCityMetrics] = useState<CityMetrics | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>("1w");
  const [showIndexPrice, setShowIndexPrice] = useState(true);
  const [showMarketPrice, setShowMarketPrice] = useState(false);
  const [showFPU, setShowFPU] = useState(false);
  const [showVolume, setShowVolume] = useState(false);
  const [tradeType, setTradeType] = useState<"long" | "short">("long");
  const [amount, setAmount] = useState("");
  const [size, setSize] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const backendClient = useBackend();

  useEffect(() => {
    if (cityCode) {
      loadCityData();
      loadBalance();
    }
  }, [cityCode]);

  useEffect(() => {
    if (city) {
      loadCityMetrics();
    }
  }, [city]);

  const loadCityData = async () => {
    if (!cityCode) return;
    
    setIsLoading(true);
    try {
      // Get city by code
      const cityResponse = await backend.city.getByCode({ code: cityCode });
      setCity(cityResponse.city);
      
      // Load price history
      const priceResponse = await backend.city.getPriceHistory({ 
        cityId: cityResponse.city.id, 
        years: 25 
      });
      setPriceHistory(priceResponse.prices);
    } catch (error) {
      console.error("Error loading city data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "City not found",
      });
      navigate("/");
    } finally {
      setIsLoading(false);
    }
  };

  const loadBalance = async () => {
    try {
      const response = await backendClient.user.getBalance();
      setBalance(response.balance);
    } catch (error) {
      console.error("Error loading balance:", error);
    }
  };

  const loadCityMetrics = async () => {
    if (!city) return;
    
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
    if (!priceHistory.length || !city) return [];
    
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
    if (!city || priceHistory.length === 0) return city?.indexPriceUsd || 0;
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
  }, [priceHistory, city]);

  const priceChange = city ? city.indexPriceUsd - weekAgoPrice : 0;
  const priceChangePercent = weekAgoPrice > 0 ? (priceChange / weekAgoPrice) * 100 : 0;

  // Use real data from API
  const marketPrice = city?.marketPriceUsd || 0;
  const indexPrice = city?.indexPriceUsd || 0;
  
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

  const getDateLabel = (timestamp: Date | number) => {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    
    // Formatting depends on the selected time range
    switch (timeRange) {
      case "1d":
        // For day, show time
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      
      case "1w":
        // For week, show weekday and day number
        return date.toLocaleDateString([], { weekday: "short", day: "numeric" });
      
      case "1m":
        // For month, show each day: "Dec 1", "Dec 2", etc.
        return date.toLocaleDateString([], { month: "short", day: "numeric" });
      
      case "all":
        // For all period, show date with year (unified format)
        return date.toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" });
      
      default:
        // Fallback
        return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  const handleTrade = async () => {
    if (!city) return;
    
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

      loadBalance();
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
  const displayCityCode = useMemo(() => {
    if (!city) return cityCode || "";
    const parts = city.name.split(",");
    if (parts.length > 1) {
      const state = parts[1].trim();
      const cityName = parts[0].trim();
      const stateCode = state.length === 2 ? state.toUpperCase() : state.substring(0, 3).toUpperCase();
      const cityCodePart = cityName.substring(0, 3).toUpperCase();
      return `${stateCode}-${cityCodePart}`;
    }
    const countryCode = city.country.substring(0, 2).toUpperCase();
    const cityName = city.name.split(",")[0].trim();
    const cityCodePart = cityName.substring(0, 3).toUpperCase();
    return `${countryCode}-${cityCodePart}`;
  }, [city, cityCode]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-9 w-24 mb-6" />
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-32" />
                <div className="space-y-2">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-6 w-64" />
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
              <Skeleton className="h-96 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!city) {
    return null;
  }

  const amountNum = parseFloat(amount) || 0;
  const sizeNum = parseFloat(size) || 0;
  const calculatedSize = amountNum > 0 ? amountNum / indexPrice : sizeNum;
  const calculatedAmount = sizeNum > 0 ? sizeNum * indexPrice : amountNum;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="container mx-auto px-4 py-8">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
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
            <PriceUpdateTimer />
          </div>

          {/* Tabs */}
          <Tabs defaultValue="pricing" className="w-full">
            <TabsList className="bg-muted">
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
            </TabsList>

            <TabsContent value="pricing" className="space-y-6 mt-6">
              {/* Market metrics */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-white rounded-lg p-4 border border-border shadow-sm">
                  <div className="flex items-center gap-1 mb-1">
                    <p className="text-xs text-muted-foreground">Market Price</p>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Real estate price from Zillow data (fair value)</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-lg font-bold">${marketPrice.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">
                    Diff: {((indexPrice - marketPrice) / marketPrice * 100).toFixed(2)}%
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-border shadow-sm">
                  <div className="flex items-center gap-1 mb-1">
                    <p className="text-xs text-muted-foreground">24h Volume</p>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Total trading volume in the last 24 hours</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-lg font-bold">{formatVolume(volume24h)}</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-border shadow-sm">
                  <div className="flex items-center gap-1 mb-1">
                    <p className="text-xs text-muted-foreground">Open Interest</p>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Total value of all open positions (Long/Short ratio)</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-lg font-bold">{formatVolume(openInterest)}</p>
                  <p className="text-xs text-muted-foreground">{((longOI / openInterest) * 100).toFixed(2)}% {((shortOI / openInterest) * 100).toFixed(2)}%</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-border shadow-sm">
                  <div className="flex items-center gap-1 mb-1">
                    <p className="text-xs text-muted-foreground">Funding Rate</p>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Rate paid by majority side to minority side. Positive = longs pay shorts, Negative = shorts pay longs</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className={`text-lg font-bold ${city.fundingRate >= 0 ? "text-red-500" : "text-green-500"}`}>
                    {(city.fundingRate * 100).toFixed(4)}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {city.fundingRate >= 0 ? "Longs pay" : "Shorts pay"}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-border shadow-sm">
                  <div className="flex items-center gap-1 mb-1">
                    <p className="text-xs text-muted-foreground">OI Avail. Long</p>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Available liquidity for opening long positions</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-lg font-bold">{formatVolume(longOIAvailable)}</p>
                  <p className="text-xs text-muted-foreground">
                    {longOIAvailable > 0 
                      ? formatVolume(longOIAvailable * 0.1)
                      : "N/A"}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-border shadow-sm">
                  <div className="flex items-center gap-1 mb-1">
                    <p className="text-xs text-muted-foreground">OI Avail. Short</p>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Available liquidity for opening short positions</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-lg font-bold">{formatVolume(shortOIAvailable)}</p>
                  <p className="text-xs text-muted-foreground">
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
                        <Info className="h-3 w-3 text-muted-foreground cursor-help" />
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
                    Volume {formatVolume(volume24h)}
                  </label>
                </div>
                <div className="ml-auto flex gap-2">
                  {(["1d", "1w", "1m", "all"] as TimeRange[]).map((range) => (
                    <Button
                      key={range}
                      variant={timeRange === range ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTimeRange(range)}
                      className={timeRange === range ? "" : ""}
                    >
                      {range === "all" ? "All" : range}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Chart */}
              <div className="bg-white rounded-lg p-4 border border-border shadow-sm">
                {filteredPriceHistory.length > 0 ? (
                  <PriceChartShadcn
                    data={filteredPriceHistory}
                    showIndexPrice={showIndexPrice}
                    showMarketPrice={showMarketPrice}
                    timeRange={timeRange}
                  />
                ) : (
                  <div className="h-96 flex items-center justify-center text-muted-foreground">
                    Loading data...
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Transaction panel */}
          <div className="bg-white rounded-lg p-6 border border-border shadow-sm">
            <ToggleGroup
              type="single"
              value={tradeType}
              onValueChange={(value) => {
                if (value) setTradeType(value as "long" | "short");
              }}
              className="mb-4 bg-muted p-1 rounded-lg"
            >
              <ToggleGroupItem
                value="long"
                aria-label="Long"
                className={tradeType === "long" ? "bg-green-600 hover:bg-green-700 text-white data-[state=on]:bg-green-600" : "bg-transparent text-muted-foreground hover:text-foreground"}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Long
              </ToggleGroupItem>
              <ToggleGroupItem
                value="short"
                aria-label="Short"
                className={tradeType === "short" ? "bg-red-600 hover:bg-red-700 text-white data-[state=on]:bg-red-600" : "bg-transparent text-muted-foreground hover:text-foreground"}
              >
                <TrendingDown className="h-4 w-4 mr-2" />
                Short
              </ToggleGroupItem>
            </ToggleGroup>

            <Separator className="mb-4" />

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-muted-foreground">Amount (USD)</label>
                  <span className="text-xs text-muted-foreground">Max: ${balance.toFixed(2)}</span>
                </div>
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
                  className="mb-2"
                />
                {balance > 0 && (
                  <Slider
                    value={[amountNum]}
                    max={balance}
                    step={100}
                    onValueChange={(values) => {
                      const val = values[0].toString();
                      setAmount(val);
                      setSize((values[0] / indexPrice).toFixed(2));
                    }}
                    className="w-full"
                  />
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-muted-foreground">Size (sqm)</label>
                  <span className="text-xs text-muted-foreground">{calculatedSize.toFixed(2)} sqm</span>
                </div>
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
                  className="mb-2"
                />
                {balance > 0 && (
                  <Slider
                    value={[sizeNum]}
                    max={balance / indexPrice}
                    step={0.1}
                    onValueChange={(values) => {
                      const val = values[0].toFixed(2);
                      setSize(val);
                      setAmount((values[0] * indexPrice).toFixed(2));
                    }}
                    className="w-full"
                  />
                )}
              </div>

              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Est. Fill Price</span>
                  <span className="text-foreground">--</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Est. Fill Price</span>
                  <span className="text-foreground">--</span>
                </div>
              </div>

              <Button
                onClick={handleTrade}
                disabled={isSubmitting || (!amount && !size)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSubmitting ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Wallet className="h-4 w-4 mr-2" />
                    Connect Wallet
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">Slippage 2.00%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



