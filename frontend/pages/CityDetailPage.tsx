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
import { Building2, Wallet, ArrowLeft, Info, TrendingUp, TrendingDown, Maximize2, Minimize2, X } from "lucide-react";
import PriceUpdateTimer from "@/components/PriceUpdateTimer";
import PriceChartShadcn from "@/components/PriceChartShadcn";
import CityInfoModal from "@/components/CityInfoModal";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
// Import city icons
import nyIcon from "@/components/ui/icon/NY.png";
import miamiIcon from "@/components/ui/icon/miami.png";
import laIcon from "@/components/ui/icon/LA.png";
import chicagoIcon from "@/components/ui/icon/chicago.png";
import dallasIcon from "@/components/ui/icon/dallas.png";
import houstonIcon from "@/components/ui/icon/houston.png";
import washingtonIcon from "@/components/ui/icon/Washington.png";
import philadelphiaIcon from "@/components/ui/icon/Philadelphia.png";

// Function for get a parth to city icon
const getCityIcon = (cityName: string): string | null => {
  const cityNameOnly = cityName.split(",")[0].trim().toLowerCase();
  
  const iconMap: Record<string, string> = {
    "new york": nyIcon,
    "miami": miamiIcon,
    "los angeles": laIcon,
    "chicago": chicagoIcon,
    "dallas": dallasIcon,
    "houston": houstonIcon,
    "washington": washingtonIcon,
    "philadelphia": philadelphiaIcon,
  };
  
  return iconMap[cityNameOnly] || null;
};

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
  const [isChartFullscreen, setIsChartFullscreen] = useState(false);
  const [showTradeConfirm, setShowTradeConfirm] = useState(false);
  const [showCityInfo, setShowCityInfo] = useState(false);
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
      
      // Load price history - use large number to get all data
      // For "all" period we need all data from DB, not just last 25 years
      const priceResponse = await backend.city.getPriceHistory({ 
        cityId: cityResponse.city.id, 
        years: 30 // Increased to ensure we get all data (data starts from 2000, so 30 years covers everything)
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

  // Helper function to get the most recent point or city's current price
  const getLastKnownPoint = (): PricePoint | null => {
    if (priceHistory.length > 0) {
      return priceHistory.reduce((latest, current) => 
        new Date(current.timestamp) > new Date(latest.timestamp) ? current : latest
      );
    }
    if (city) {
      return {
        price: city.indexPriceUsd || city.currentPriceUsd,
        indexPrice: city.indexPriceUsd || city.currentPriceUsd,
        marketPrice: city.marketPriceUsd || city.currentPriceUsd,
        fundingRate: city.fundingRate || 0,
        timestamp: city.lastUpdated || new Date(),
      };
    }
    return null;
  };

  // Filter data by selected time range
  const filteredPriceHistory = useMemo(() => {
    if (!city) return [];
    
    const now = new Date();
    let cutoffDate = new Date();
    let filtered: PricePoint[] = [];
    
    switch (timeRange) {
      case "1d": {
        // For 1d, we can show data even if priceHistory is empty, using city's current price
        if (!priceHistory.length) {
          // No price history - create points from city's current price
          const fallbackPoint: PricePoint = {
            price: city.indexPriceUsd || city.currentPriceUsd,
            indexPrice: city.indexPriceUsd || city.currentPriceUsd,
            marketPrice: city.marketPriceUsd || city.currentPriceUsd,
            fundingRate: city.fundingRate || 0,
            timestamp: city.lastUpdated || new Date(),
          };
          
          const hourlyPoints: PricePoint[] = [];
          const startTime = new Date(now);
          startTime.setHours(now.getHours() - 24, 0, 0, 0);
          
          hourlyPoints.push({
            ...fallbackPoint,
            timestamp: startTime,
          });
          
          for (let i = 1; i < 4; i++) {
            const intermediateTime = new Date(startTime);
            intermediateTime.setHours(startTime.getHours() + i * 6);
            hourlyPoints.push({
              ...fallbackPoint,
              timestamp: intermediateTime,
            });
          }
          
          hourlyPoints.push({
            ...fallbackPoint,
            timestamp: now,
          });
          
          return hourlyPoints;
        }
        
        cutoffDate.setDate(now.getDate() - 1);
        cutoffDate.setHours(0, 0, 0, 0); // Start of day yesterday
        filtered = priceHistory.filter((point) => new Date(point.timestamp) >= cutoffDate);
        
        // Get today's start
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);
        
        // Filter data for today only
        const todayData = filtered.filter((point) => new Date(point.timestamp) >= todayStart);
        
        // Get the last known price before today (from yesterday or earlier)
        let lastKnownPoint: PricePoint | null = null;
        const beforeTodayData = filtered.filter((point) => new Date(point.timestamp) < todayStart);
        if (beforeTodayData.length > 0) {
          lastKnownPoint = beforeTodayData.reduce((latest, current) => 
            new Date(current.timestamp) > new Date(latest.timestamp) ? current : latest
          );
        }
        
        // If no data before today, use getLastKnownPoint() which falls back to city's current price
        if (!lastKnownPoint) {
          lastKnownPoint = getLastKnownPoint();
        }
        
        // If we have trades today, create points from start of day to trades
        if (todayData.length > 0) {
          const hourlyPoints: PricePoint[] = [];
          
          // Sort today's data by timestamp
          const sortedTodayData = [...todayData].sort((a, b) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
          
          // If we have lastKnownPoint, add a point at the start of today
          if (lastKnownPoint) {
            hourlyPoints.push({
              ...lastKnownPoint,
              timestamp: todayStart,
            });
          }
          
          // Add all trades from today
          hourlyPoints.push(...sortedTodayData);
          
          return hourlyPoints;
        } else {
          // No trades today - show flat line at last known price for the last 24 hours
          if (lastKnownPoint) {
            // Create points for the last 24 hours at the last known price
            const hourlyPoints: PricePoint[] = [];
            const startTime = new Date(now);
            startTime.setHours(now.getHours() - 24, 0, 0, 0);
            
            // Add point at start of 24h period
            hourlyPoints.push({
              ...lastKnownPoint,
              timestamp: startTime,
            });
            
            // Add a few intermediate points for smoother line display
            for (let i = 1; i < 4; i++) {
              const intermediateTime = new Date(startTime);
              intermediateTime.setHours(startTime.getHours() + i * 6);
              hourlyPoints.push({
                ...lastKnownPoint,
                timestamp: intermediateTime,
              });
            }
            
            // Add point at current time
            hourlyPoints.push({
              ...lastKnownPoint,
              timestamp: now,
            });
            
            return hourlyPoints;
          }
          
          // Fallback: if no lastKnownPoint, create points from city's current price
          if (city) {
            const fallbackPoint: PricePoint = {
              price: city.indexPriceUsd || city.currentPriceUsd,
              indexPrice: city.indexPriceUsd || city.currentPriceUsd,
              marketPrice: city.marketPriceUsd || city.currentPriceUsd,
              fundingRate: city.fundingRate || 0,
              timestamp: city.lastUpdated || new Date(),
            };
            
            const hourlyPoints: PricePoint[] = [];
            const startTime = new Date(now);
            startTime.setHours(now.getHours() - 24, 0, 0, 0);
            
            hourlyPoints.push({
              ...fallbackPoint,
              timestamp: startTime,
            });
            
            for (let i = 1; i < 4; i++) {
              const intermediateTime = new Date(startTime);
              intermediateTime.setHours(startTime.getHours() + i * 6);
              hourlyPoints.push({
                ...fallbackPoint,
                timestamp: intermediateTime,
              });
            }
            
            hourlyPoints.push({
              ...fallbackPoint,
              timestamp: now,
            });
            
            return hourlyPoints;
          }
          
          // Final fallback: return filtered data even if empty
          return filtered;
        }
      }
      case "1w": {
        cutoffDate.setDate(now.getDate() - 7);
        cutoffDate.setHours(0, 0, 0, 0); // Start of day
        filtered = priceHistory.filter((point) => new Date(point.timestamp) >= cutoffDate);
        
        // Aggregate by day first
        const aggregated = aggregateByDay(filtered);
        
        // Create array for 7 days (from 7 days ago to today)
        const dailyPoints: PricePoint[] = [];
        const aggregatedMap = new Map<string, PricePoint>();
        
        // Create map of aggregated data by day key
        aggregated.forEach((point) => {
          const date = new Date(point.timestamp);
          const dayKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          aggregatedMap.set(dayKey, point);
        });
        
        // Initialize lastKnownPoint with most recent data or city's current price
        let lastKnownPoint: PricePoint | null = getLastKnownPoint();
        
        for (let i = 6; i >= 0; i--) {
          const targetDate = new Date(now);
          targetDate.setDate(now.getDate() - i);
          targetDate.setHours(12, 0, 0, 0); // Set to noon for consistent display
          
          const dayKey = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;
          
          // Check if we have data for this day
          const dayData = aggregatedMap.get(dayKey);
          
          if (dayData) {
            // Use aggregated data for this day
            dailyPoints.push({
              ...dayData,
              timestamp: targetDate, // Use target date for consistent display
            });
            lastKnownPoint = dayData;
          } else if (lastKnownPoint) {
            // Use last known values if no data for this day
            dailyPoints.push({
              price: lastKnownPoint.price,
              indexPrice: lastKnownPoint.indexPrice || lastKnownPoint.price,
              marketPrice: lastKnownPoint.marketPrice || lastKnownPoint.price,
              fundingRate: lastKnownPoint.fundingRate || 0,
              timestamp: targetDate,
            });
          } else {
            // Final fallback: use city's current price if available
            if (city) {
              dailyPoints.push({
                price: city.indexPriceUsd || city.currentPriceUsd,
                indexPrice: city.indexPriceUsd || city.currentPriceUsd,
                marketPrice: city.marketPriceUsd || city.currentPriceUsd,
                fundingRate: city.fundingRate || 0,
                timestamp: targetDate,
              });
            }
          }
        }
        
        return dailyPoints;
      }
      case "1m": {
        if (!priceHistory.length) return [];
        cutoffDate.setMonth(now.getMonth() - 1);
        cutoffDate.setHours(0, 0, 0, 0);
        filtered = priceHistory.filter((point) => new Date(point.timestamp) >= cutoffDate);
        
        // Aggregate by day first
        const aggregated = aggregateByDay(filtered);
        
        // Create array for 30 days (from 30 days ago to today)
        const dailyPoints: PricePoint[] = [];
        const aggregatedMap = new Map<string, PricePoint>();
        
        // Create map of aggregated data by day key
        aggregated.forEach((point) => {
          const date = new Date(point.timestamp);
          const dayKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          aggregatedMap.set(dayKey, point);
        });
        
        // Initialize lastKnownPoint with most recent data or city's current price
        let lastKnownPoint: PricePoint | null = getLastKnownPoint();
        
        // Generate points for each of the 30 days
        for (let i = 29; i >= 0; i--) {
          const targetDate = new Date(now);
          targetDate.setDate(now.getDate() - i);
          targetDate.setHours(12, 0, 0, 0);
          
          const dayKey = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;
          
          // Check if we have data for this day
          const dayData = aggregatedMap.get(dayKey);
          
          if (dayData) {
            dailyPoints.push({
              ...dayData,
              timestamp: targetDate,
            });
            lastKnownPoint = dayData;
          } else if (lastKnownPoint) {
            dailyPoints.push({
              price: lastKnownPoint.price,
              indexPrice: lastKnownPoint.indexPrice || lastKnownPoint.price,
              marketPrice: lastKnownPoint.marketPrice || lastKnownPoint.price,
              fundingRate: lastKnownPoint.fundingRate || 0,
              timestamp: targetDate,
            });
          } else if (city) {
            dailyPoints.push({
              price: city.indexPriceUsd || city.currentPriceUsd,
              indexPrice: city.indexPriceUsd || city.currentPriceUsd,
              marketPrice: city.marketPriceUsd || city.currentPriceUsd,
              fundingRate: city.fundingRate || 0,
              timestamp: targetDate,
            });
          }
        }
        
        return dailyPoints;
      }
      case "all": {
        if (!priceHistory.length) return [];
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

        // If no data, return empty array
        if (priceHistory.length === 0) {
          return [];
        }

        // Find the earliest and latest timestamps from all data in DB
        let earliestTime = new Date(priceHistory[0].timestamp).getTime();
        let latestTime = earliestTime;
        
        priceHistory.forEach((point) => {
          const pointTime = new Date(point.timestamp).getTime();
          if (pointTime < earliestTime) earliestTime = pointTime;
          if (pointTime > latestTime) latestTime = pointTime;
        });
        
        // Create map of aggregated data by month key
        const aggregatedMap = new Map<string, PricePoint>();
        aggregated.forEach((point) => {
          const date = new Date(point.timestamp);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          aggregatedMap.set(monthKey, point);
        });
        
        // Generate points for each month from earliest month to latest month
        const monthlyPoints: PricePoint[] = [];
        let lastKnownPoint: PricePoint | null = aggregated.length > 0 ? aggregated[0] : null;
        
        // Start from the first day of the earliest month
        const earliestDate = new Date(earliestTime);
        let currentYear = earliestDate.getFullYear();
        let currentMonth = earliestDate.getMonth();
        
        // End at the last month (inclusive)
        const latestDate = new Date(latestTime);
        const endYear = latestDate.getFullYear();
        const endMonth = latestDate.getMonth();
        
        // Safety check: ensure we have valid dates
        if (isNaN(currentYear) || isNaN(currentMonth) || isNaN(endYear) || isNaN(endMonth)) {
          console.error("Invalid date range for All period", { currentYear, currentMonth, endYear, endMonth, earliestTime, latestTime });
          return aggregated; // Fallback to aggregated data
        }
        
        // Generate points for each month from earliest to latest (inclusive)
        // Use a counter to prevent infinite loops
        let iterations = 0;
        const maxIterations = (endYear - currentYear) * 12 + (endMonth - currentMonth) + 1;
        
        while ((currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth)) && iterations < maxIterations + 12) {
          iterations++;
          const monthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
          const monthData = aggregatedMap.get(monthKey);
          
          // Create timestamp for this month (first day at noon)
          const monthTimestamp = new Date(currentYear, currentMonth, 1, 12, 0, 0, 0);
          
          if (monthData) {
            monthlyPoints.push({
              ...monthData,
              timestamp: monthTimestamp,
            });
            lastKnownPoint = monthData;
          } else if (lastKnownPoint) {
            monthlyPoints.push({
              price: lastKnownPoint.price,
              indexPrice: lastKnownPoint.indexPrice || lastKnownPoint.price,
              marketPrice: lastKnownPoint.marketPrice || lastKnownPoint.price,
              fundingRate: lastKnownPoint.fundingRate || 0,
              timestamp: monthTimestamp,
            });
          } else if (city) {
            // Fallback to city's current price if no data at all
            monthlyPoints.push({
              price: city.indexPriceUsd || city.currentPriceUsd,
              indexPrice: city.indexPriceUsd || city.currentPriceUsd,
              marketPrice: city.marketPriceUsd || city.currentPriceUsd,
              fundingRate: city.fundingRate || 0,
              timestamp: monthTimestamp,
            });
            if (!lastKnownPoint) {
              lastKnownPoint = {
                price: city.indexPriceUsd || city.currentPriceUsd,
                indexPrice: city.indexPriceUsd || city.currentPriceUsd,
                marketPrice: city.marketPriceUsd || city.currentPriceUsd,
                fundingRate: city.fundingRate || 0,
                timestamp: city.lastUpdated || new Date(),
              };
            }
          }
          
          // Move to next month
          currentMonth++;
          if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
          }
        }
        
        // Debug log
        if (monthlyPoints.length === 0) {
          console.warn("No monthly points generated for All period", {
            priceHistoryLength: priceHistory.length,
            aggregatedLength: aggregated.length,
            earliestTime: new Date(earliestTime).toISOString(),
            latestTime: new Date(latestTime).toISOString(),
            startYear: earliestDate.getFullYear(),
            startMonth: earliestDate.getMonth(),
            endYear,
            endMonth,
          });
          // Fallback: return aggregated data if we couldn't generate monthly points
          return aggregated;
        }
        
        return monthlyPoints;
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
  
  // Calculate price per sqft
  const pricePerSqft = city?.averagePropertySizeSqft 
    ? indexPrice / city.averagePropertySizeSqft 
    : indexPrice; // Fallback to indexPrice if averagePropertySizeSqft is not available
  
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

  const handleTradeClick = () => {
    if (!canTrade) return;
    setShowTradeConfirm(true);
  };

  const handleTradeConfirm = async () => {
    if (!city) return;
    
    setIsSubmitting(true);
    setShowTradeConfirm(false);

    try {
      const amountNum = amount ? parseFloat(amount) : parseFloat(size) * pricePerSqft;
      
      if (amountNum <= 0) {
        throw new Error("Amount must be positive");
      }

      if (amountNum > balance) {
        throw new Error("Insufficient balance");
      }

      const response = await backendClient.trading.openPosition({
        cityId: city.id,
        positionType: tradeType,
        amountUsd: amountNum,
        leverage: 1,
      });

      toast({
        title: "Position opened!",
        description: `${tradeType === "long" ? "Bought" : "Sold"} ${response.quantitySqm.toFixed(2)} sqft at $${response.entryPrice.toFixed(2)}/sqft`,
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
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
  const calculatedSize = amountNum > 0 ? amountNum / pricePerSqft : sizeNum;
  const calculatedAmount = sizeNum > 0 ? sizeNum * pricePerSqft : amountNum;
  
  // Calculate estimated fill price (using current index price with slippage)
  const slippage = 0.02; // 2% slippage
  const estFillPrice = indexPrice * (1 + (tradeType === "long" ? slippage : -slippage));
  const estFillPriceFormatted = estFillPrice.toFixed(2);
  
  // Validation
  const isValidAmount = amountNum > 0 && amountNum <= balance;
  const isValidSize = sizeNum > 0 && calculatedAmount <= balance;
  const hasError = (amount && !isValidAmount) || (size && !isValidSize);
  const canTrade = (amountNum > 0 || sizeNum > 0) && isValidAmount && isValidSize;
  
  // GEt icon cities
  const cityIcon = getCityIcon(city.name);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
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
                {cityIcon ? (
                  <img 
                    src={cityIcon} 
                    alt={city.name.split(",")[0]} 
                    className="h-16 w-16 object-contain"
                  />
                ) : (
                  <Building2 className="h-16 w-16 text-primary" />
                )}
                <div>
                  <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0 text-foreground">{city.name.split(",")[0]}</h2>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-lg font-semibold text-foreground">${indexPrice.toFixed(2)}</span>
                    <span className={`text-sm leading-none font-medium ${priceChange >= 0 ? "text-green-500" : "text-red-500"}`}>
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
            <div className="flex items-center gap-2 mb-4">
              <TabsList className="bg-muted">
                <TabsTrigger value="pricing">Pricing</TabsTrigger>
              </TabsList>
              <Button
                variant="outline"
                onClick={() => setShowCityInfo(true)}
                className="flex items-center gap-2"
              >
                Info
              </Button>
            </div>

            <TabsContent value="pricing" className="space-y-6 mt-6">
              {/* Market metrics */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4" role="region" aria-label="Market metrics">
                <div className="bg-white dark:bg-card rounded-lg p-4 border border-border shadow-sm">
                  <div className="flex items-center gap-1 mb-1">
                    <p className="text-sm leading-none font-medium text-muted-foreground">Market Price</p>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Real estate price from Zillow data (fair value)</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-lg font-semibold text-foreground">${marketPrice.toFixed(2)}</p>
                  <p className="text-sm leading-none font-medium text-muted-foreground">
                    Diff: {((indexPrice - marketPrice) / marketPrice * 100).toFixed(2)}%
                  </p>
                </div>
                <div className="bg-white dark:bg-card rounded-lg p-4 border border-border shadow-sm">
                  <div className="flex items-center gap-1 mb-1">
                    <p className="text-sm leading-none font-medium text-muted-foreground">24h Volume</p>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Total trading volume in the last 24 hours</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-lg font-semibold text-foreground">{formatVolume(volume24h)}</p>
                </div>
                <div className="bg-white dark:bg-card rounded-lg p-4 border border-border shadow-sm">
                  <div className="flex items-center gap-1 mb-1">
                    <p className="text-sm leading-none font-medium text-muted-foreground">Open Interest</p>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Total value of all open positions (Long/Short ratio)</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-lg font-semibold text-foreground">{formatVolume(openInterest)}</p>
                  <p className="text-sm leading-none font-medium text-muted-foreground">
                    {openInterest > 0 
                      ? `${((longOI / openInterest) * 100).toFixed(2)}% ${((shortOI / openInterest) * 100).toFixed(2)}%`
                      : "N/A"}
                  </p>
                </div>
                <div className="bg-white dark:bg-card rounded-lg p-4 border border-border shadow-sm">
                  <div className="flex items-center gap-1 mb-1">
                    <p className="text-sm leading-none font-medium text-muted-foreground">Funding Rate</p>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Rate paid by majority side to minority side. Positive = longs pay shorts, Negative = shorts pay longs</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className={`text-lg font-semibold ${city.fundingRate >= 0 ? "text-red-500" : "text-green-500"}`}>
                    {(city.fundingRate * 100).toFixed(4)}%
                  </p>
                  <p className="text-sm leading-none font-medium text-muted-foreground">
                    {city.fundingRate >= 0 ? "Longs pay" : "Shorts pay"}
                  </p>
                </div>
                <div className="bg-white dark:bg-card rounded-lg p-4 border border-border shadow-sm">
                  <div className="flex items-center gap-1 mb-1">
                    <p className="text-sm leading-none font-medium text-muted-foreground">Longs</p>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Available liquidity for opening long positions</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-lg font-semibold text-foreground">{formatVolume(longOIAvailable)}</p>
                  <p className="text-sm leading-none font-medium text-muted-foreground">
                    {longOIAvailable > 0 
                      ? formatVolume(longOIAvailable * 0.1)
                      : "N/A"}
                  </p>
                </div>
                <div className="bg-white dark:bg-card rounded-lg p-4 border border-border shadow-sm">
                  <div className="flex items-center gap-1 mb-1">
                    <p className="text-sm leading-none font-medium text-muted-foreground">Shorts</p>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Available liquidity for opening short positions</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-lg font-semibold text-foreground">{formatVolume(shortOIAvailable)}</p>
                  <p className="text-sm leading-none font-medium text-muted-foreground">
                    {shortOIAvailable > 0 
                      ? formatVolume(shortOIAvailable * 1.3)
                      : "N/A"}
                  </p>
                </div>
              </div>

              {/* Checkboxes and time interval */}
              <div className="flex flex-wrap items-center gap-4" role="group" aria-label="Chart display settings">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="index-price"
                    checked={showIndexPrice}
                    onCheckedChange={(checked) => setShowIndexPrice(checked === true)}
                  />
                  <label htmlFor="index-price" className="text-sm leading-none font-medium cursor-pointer text-foreground">
                    Index Price ${indexPrice.toFixed(2)}
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="market-price"
                    checked={showMarketPrice}
                    onCheckedChange={(checked) => setShowMarketPrice(checked === true)}
                  />
                  <label htmlFor="market-price" className="text-sm leading-none font-medium cursor-pointer text-foreground">
                    Market Price ${marketPrice.toFixed(2)}
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm leading-none font-medium flex items-center gap-1 text-foreground">
                    FPU {(indexPrice - marketPrice).toFixed(2)}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Fair Price Uncertainty - difference between Index and Market price</p>
                      </TooltipContent>
                    </Tooltip>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-foreground">
                    Volume {formatVolume(volume24h)}
                  </span>
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

              {/* Chart and Transaction panel */}
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="w-full lg:w-1/2 bg-white dark:bg-card rounded-lg p-4 border border-border shadow-sm relative group">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setIsChartFullscreen(true)}
                    aria-label="Open chart in fullscreen mode"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
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

                {/* Fullscreen Chart Dialog */}
                <Dialog open={isChartFullscreen} onOpenChange={setIsChartFullscreen}>
                  <DialogContent 
                    className="!max-w-none !max-h-none !w-screen !h-screen !p-6 !m-0 !rounded-none !top-0 !left-0 !translate-x-0 !translate-y-0 flex flex-col" 
                    showCloseButton={false}
                    style={{ width: '100vw', height: '100vh', maxWidth: '100vw', maxHeight: '100vh' }}
                  >
                    <DialogHeader className="flex-shrink-0">
                      <DialogTitle className="flex items-center justify-between">
                        <span>Price Chart - {city.name.split(",")[0]}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setIsChartFullscreen(false)}
                          aria-label="Close fullscreen mode"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 mt-4 min-h-0">
                      {filteredPriceHistory.length > 0 ? (
                        <PriceChartShadcn
                          data={filteredPriceHistory}
                          showIndexPrice={showIndexPrice}
                          showMarketPrice={showMarketPrice}
                          timeRange={timeRange}
                          height={window.innerHeight - 150}
                        />
                      ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground">
                          Loading data...
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Transaction panel */}
                <div className="w-full lg:w-1/2 bg-white dark:bg-card rounded-lg p-6 border border-border shadow-sm">
            <ToggleGroup
              type="single"
              value={tradeType}
              onValueChange={(value) => {
                if (value) setTradeType(value as "long" | "short");
              }}
              className="mb-4 bg-muted p-1 rounded-lg grid grid-cols-2 gap-2"
              role="radiogroup"
              aria-label="Select position type"
            >
              <ToggleGroupItem
                value="long"
                aria-label="Long position"
                className={cn(
                  "h-12 text-base font-semibold",
                  tradeType === "long" 
                    ? "bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white data-[state=on]:bg-green-600" 
                    : "bg-transparent text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <TrendingUp className="h-5 w-5 mr-2" />
                Long
              </ToggleGroupItem>
              <ToggleGroupItem
                value="short"
                aria-label="Short position"
                className={cn(
                  "h-12 text-base font-semibold",
                  tradeType === "short" 
                    ? "bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white data-[state=on]:bg-red-600" 
                    : "bg-transparent text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <TrendingDown className="h-5 w-5 mr-2" />
                Short
              </ToggleGroupItem>
            </ToggleGroup>

            <Separator className="mb-4" />

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm leading-none font-medium text-muted-foreground" htmlFor="amount-input">Amount (USD)</label>
                  <span className="text-sm leading-none font-medium text-muted-foreground" aria-label={`Maximum balance: $${balance.toFixed(2)}`}>Max: ${balance.toFixed(2)}</span>
                </div>
                <Input
                  id="amount-input"
                  type="number"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    if (e.target.value) {
                      setSize((parseFloat(e.target.value) / pricePerSqft).toFixed(2));
                    } else {
                      setSize("");
                    }
                  }}
                  className={cn("mb-2", hasError && amount && !isValidAmount && "border-red-500 focus-visible:ring-red-500")}
                  {...(hasError && amount && !isValidAmount ? { "aria-invalid": true as const, "aria-describedby": "amount-error" } : {})}
                />
                {hasError && amount && !isValidAmount && (
                  <p id="amount-error" className="text-xs text-red-600 dark:text-red-400 mt-1" role="alert">
                    {amountNum > balance ? "Balance exceeded" : "Enter a valid amount"}
                  </p>
                )}
                {balance > 0 && (
                  <Slider
                    value={[amountNum]}
                    max={balance}
                    step={100}
                    onValueChange={(values) => {
                      const val = values[0].toString();
                      setAmount(val);
                      setSize((values[0] / pricePerSqft).toFixed(2));
                    }}
                    className="w-full"
                  />
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-muted-foreground">Size (sqft)</label>
                  <span className="text-xs text-muted-foreground">{calculatedSize.toFixed(2)} sqft</span>
                </div>
                <Input
                  type="number"
                  placeholder="0"
                  value={size}
                  onChange={(e) => {
                    setSize(e.target.value);
                    if (e.target.value) {
                      setAmount((parseFloat(e.target.value) * pricePerSqft).toFixed(2));
                    } else {
                      setAmount("");
                    }
                  }}
                  className="mb-2"
                />
                {balance > 0 && (
                  <Slider
                    value={[sizeNum]}
                    max={balance / pricePerSqft}
                    step={0.1}
                    onValueChange={(values) => {
                      const val = values[0].toFixed(2);
                      setSize(val);
                      setAmount((values[0] * pricePerSqft).toFixed(2));
                    }}
                    className="w-full"
                  />
                )}
              </div>

              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Est. Fill Price</span>
                  <span className="text-foreground font-semibold" aria-label={`Estimated fill price: $${estFillPriceFormatted}`}>
                    ${estFillPriceFormatted}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Est. Size</span>
                  <span className="text-foreground font-semibold" aria-label={`Estimated size: ${calculatedSize.toFixed(2)} sqft`}>
                    {calculatedSize.toFixed(2)} sqft
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Slippage</span>
                  <span className="text-foreground">2.00%</span>
                </div>
              </div>

              <Button
                onClick={handleTradeClick}
                disabled={isSubmitting || !canTrade}
                className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white touch-manipulation"
                aria-label={tradeType === "long" ? "Open long position" : "Open short position"}
              >
                {isSubmitting ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Processing...
                  </>
                ) : (
                  tradeType === "long" ? "Long" : "Short"
                )}
              </Button>

            </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Trade Confirmation Dialog */}
      <Dialog open={showTradeConfirm} onOpenChange={setShowTradeConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Trade Confirmation</DialogTitle>
            <DialogDescription>
              Please confirm your trade details before execution.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Position Type:</span>
                <span className="text-sm font-semibold">{tradeType === "long" ? "Long" : "Short"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Amount:</span>
                <span className="text-sm font-semibold">${calculatedAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Size:</span>
                <span className="text-sm font-semibold">{calculatedSize.toFixed(2)} sqft</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Estimated Price:</span>
                <span className="text-sm font-semibold">${estFillPriceFormatted}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">City:</span>
                <span className="text-sm font-semibold">{city.name.split(",")[0]}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowTradeConfirm(false)}>
              Cancel
            </Button>
            <Button onClick={handleTradeConfirm} disabled={isSubmitting}>
              {isSubmitting ? "Processing..." : "Confirm"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <CityInfoModal
        isOpen={showCityInfo}
        onClose={() => setShowCityInfo(false)}
        city={city}
      />
    </div>
  );
}
