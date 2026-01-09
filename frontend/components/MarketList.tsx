import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { City } from "~backend/city/list";
import type { PricePoint } from "~backend/city/price_history";
import type { CityMetrics } from "~backend/city/get_metrics";
import backend from "~backend/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Empty } from "@/components/ui/empty";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Search, Filter, List, Settings, X, ChevronDown, ChevronUp } from "lucide-react";
import PriceUpdateTimer from "@/components/PriceUpdateTimer";
import { getCityCardImage } from "@/data/cityImages";
import { useUnitPreference } from "@/lib/useUnitPreference";

interface MarketListProps {
  cities: City[];
  balance: number;
  onTradeComplete: () => void;
}

// APAC countries list - defined outside component
const APAC_COUNTRIES = [
  "Japan",
  "Singapore",
  "Hong Kong",
  "China",
  "Australia",
  "South Korea",
];

// Europe cities list - defined outside component
const EUROPE_CITIES = [
  "London",
  "Paris",
  "Berlin",
];

interface MarketRowProps {
  city: City;
  balance: number;
  onTradeComplete: () => void;
}

function MarketCard({ city, balance, onTradeComplete }: MarketRowProps) {
  const navigate = useNavigate();
  const { unitType, convertFromSqft, getUnitLabel } = useUnitPreference();
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [cityMetrics, setCityMetrics] = useState<CityMetrics | null>(null);

  useEffect(() => {
    const loadPriceHistory = async () => {
      try {
        // Request 25 years of data to display history from 2000
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

    loadPriceHistory();
    loadCityMetrics();
  }, [city.id]);

  // Calculate 24h price change: find price from 24 hours ago
  const priceChange24h = useMemo(() => {
    if (priceHistory.length < 2) return 0;
    
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    // Find the price point closest to 24 hours ago
    let price24hAgo: number | null = null;
    let closestTimeDiff = Infinity;
    
    for (const point of priceHistory) {
      const pointTime = new Date(point.timestamp);
      const timeDiff = Math.abs(pointTime.getTime() - twentyFourHoursAgo.getTime());
      
      if (timeDiff < closestTimeDiff) {
        closestTimeDiff = timeDiff;
        price24hAgo = point.indexPrice;
      }
    }
    
    // If we found a price within 2 hours of 24h ago, use it
    // Otherwise, use the oldest price in history as fallback
    if (price24hAgo !== null && closestTimeDiff < 2 * 60 * 60 * 1000) {
      return ((city.indexPriceUsd - price24hAgo) / price24hAgo) * 100;
    }
    
    // Fallback: if no recent data, return 0
    return 0;
  }, [priceHistory, city.indexPriceUsd]);

  const changeColor = priceChange24h >= 0 ? "text-green-500" : "text-red-500";

  // Use real volume from city metrics
  const transactionVolume = cityMetrics?.volume24h || 0;
  
  // Format transaction volume: show in millions if >= 1M, otherwise in thousands
  const formatTransactionVolume = (volume: number): string => {
    if (volume >= 1000000) {
      return `$${(volume / 1000000).toFixed(2)}M`;
    } else {
      return `$${(volume / 1000).toFixed(2)}K`;
    }
  };

  // Determine market type based on price change
  const getMarketType = () => {
    if (priceChange24h > 2) return { type: "Seller's Market", color: "bg-red-500", fill: 60 };
    if (priceChange24h < -2) return { type: "Buyer's Market", color: "bg-green-500", fill: 85 };
    return { type: "Balanced Market", color: "bg-gray-400", fill: 50 };
  };

  const marketType = getMarketType();

  const getCityImageUrl = () => {
    // Use function to get card image from cityImages.ts
    const imageUrl = getCityCardImage(city.name);
    if (imageUrl) {
      return imageUrl;
    }
    
    // Fallback to Unsplash, if no image is found in cityImages.ts
    const cityName = city.name.split(",")[0].trim().toLowerCase();
    return `https://source.unsplash.com/400x250/?${encodeURIComponent(cityName)},city`;
  };

  // Format city name (e.g., "Austin, TX")
  const cityDisplayName = city.name.includes(",") ? city.name : `${city.name}, ${city.country}`;

  // Generate city code for URL
  const getCityCode = () => {
    const parts = city.name.split(",");
    if (parts.length > 1) {
      const state = parts[1].trim();
      const cityName = parts[0].trim();
      const stateCode = state.length === 2 ? state.toUpperCase() : state.substring(0, 3).toUpperCase();
      const cityCode = cityName.substring(0, 3).toUpperCase();
      return `${stateCode}-${cityCode}`;
    }
    const countryCode = city.country.substring(0, 2).toUpperCase();
    const cityName = city.name.split(",")[0].trim();
    const cityCode = cityName.substring(0, 3).toUpperCase();
    return `${countryCode}-${cityCode}`;
  };

  const handleCardClick = () => {
    const cityCode = getCityCode();
    navigate(`/home-value-index/${cityCode}`);
  };

  return (
    <>
      <Card 
        className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer p-0 bg-white dark:bg-card border border-slate-200/80 dark:border-slate-700/50 shadow-sm hover:scale-[1.02] group" 
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
        aria-label={`Open market details for ${cityDisplayName}`}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleCardClick();
          }
        }}
      >
        {/* City Image */}
        <div className="relative w-full overflow-hidden rounded-t-xl aspect-[16/9] group-hover:scale-105 transition-transform duration-300">
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />
          <img
            src={getCityImageUrl()}
            alt={`Skyline of ${cityDisplayName}`}
            className="w-full h-full object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={(e) => {
              // Fallback to a placeholder if image fails to load
              (e.target as HTMLImageElement).src = `https://via.placeholder.com/1200x675/1f2937/f9fafb?text=${encodeURIComponent(city.name)}`;
            }}
          />
        </div>

        <div className="p-5 space-y-3">
          {/* City Name */}
          <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">{cityDisplayName}</h3>

          {/* Transaction Volume */}
          <p className="text-sm leading-none font-medium text-slate-600 dark:text-slate-400" aria-label={`Transaction volume: ${formatTransactionVolume(transactionVolume)}`}>
            Transaction Volume {formatTransactionVolume(transactionVolume)}
          </p>

          {/* Market Type with Indicator */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge 
                variant={priceChange24h > 2 ? "destructive" : priceChange24h < -2 ? "default" : "secondary"}
                className="text-xs"
              >
                {marketType.type}
              </Badge>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${marketType.color} transition-all`}
                style={{ width: `${marketType.fill}%` }}
              />
            </div>
          </div>

          {/* Full House Price */}
          <div className="space-y-1">
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100" aria-label={`Full house price: $${city.indexPriceUsd.toFixed(2)}`}>
              ${city.indexPriceUsd.toFixed(2)}
            </p>
            
            {/* Price per Square Unit */}
            {city.averagePropertySizeSqft && (() => {
              const averageSizeInUnit = convertFromSqft(city.averagePropertySizeSqft);
              const pricePerUnit = city.indexPriceUsd / averageSizeInUnit;
              const unitLabel = getUnitLabel();
              
              return (
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400" aria-label={`Price per ${unitLabel.toLowerCase()}: $${pricePerUnit.toFixed(2)}`}>
                  ${pricePerUnit.toFixed(2)} / {unitLabel}
                </p>
              );
            })()}
          </div>

          {/* Market Price and FPU */}
          <div className="text-sm leading-none font-medium text-slate-500 dark:text-slate-400 space-y-1">
            <p aria-label={`Market price: $${city.marketPriceUsd.toFixed(2)}`}>Market: ${city.marketPriceUsd.toFixed(2)}</p>
            <p 
              className={city.indexPriceUsd > city.marketPriceUsd ? "text-green-600 dark:text-green-400 font-semibold" : "text-red-600 dark:text-red-400 font-semibold"}
              aria-label={`FPU: ${((city.indexPriceUsd - city.marketPriceUsd) / city.marketPriceUsd * 100).toFixed(2)}%`}
            >
              FPU: {((city.indexPriceUsd - city.marketPriceUsd) / city.marketPriceUsd * 100).toFixed(2)}%
            </p>
            <p aria-label={`Funding rate: ${(city.fundingRate * 100).toFixed(4)}%`}>Funding: {(city.fundingRate * 100).toFixed(4)}%</p>
          </div>

          {/* Price Change */}
          <p 
            className={`text-sm leading-none font-medium ${priceChange24h >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
            aria-label={`24h price change: ${priceChange24h >= 0 ? "+" : ""}${priceChange24h.toFixed(2)}%`}
          >
            {priceChange24h >= 0 ? "+" : ""}{priceChange24h.toFixed(2)}%
          </p>
        </div>
      </Card>
    </>
  );
}

export default function MarketList({ cities, balance, onTradeComplete }: MarketListProps) {
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const { getUnitLabel } = useUnitPreference();
  const [isApacExpanded, setIsApacExpanded] = useState(true);
  const [isUsaExpanded, setIsUsaExpanded] = useState(true);
  const [isEuropeExpanded, setIsEuropeExpanded] = useState(true);

  // Filter cities by search and price range
  const baseFilteredCities = useMemo(() => {
    return cities.filter((city) => {
      // Filter by search
      const matchesSearch =
        city.name.toLowerCase().includes(search.toLowerCase()) ||
        city.country.toLowerCase().includes(search.toLowerCase());
      if (!matchesSearch) {
        return false;
      }

      // Filter by price range
      if (minPrice && city.indexPriceUsd < parseFloat(minPrice)) {
        return false;
      }
      if (maxPrice && city.indexPriceUsd > parseFloat(maxPrice)) {
        return false;
      }

      return true;
    });
  }, [cities, search, minPrice, maxPrice]);

  // Separate cities into APAC, USA, and Europe
  const { apacCities, usaCities, europeCities } = useMemo(() => {
    const apac: typeof cities = [];
    const usa: typeof cities = [];
    const europe: typeof cities = [];

    baseFilteredCities.forEach((city) => {
      if (city.country === "USA") {
        usa.push(city);
      } else if (APAC_COUNTRIES.includes(city.country)) {
        apac.push(city);
      } else if (EUROPE_CITIES.includes(city.name)) {
        europe.push(city);
      }
      // Other cities are excluded for now
    });

    return { apacCities: apac, usaCities: usa, europeCities: europe };
  }, [baseFilteredCities, cities]);

  const clearFilters = () => {
    setMinPrice("");
    setMaxPrice("");
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (minPrice) count++;
    if (maxPrice) count++;
    return count;
  }, [minPrice, maxPrice]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight text-balance text-slate-900 dark:text-slate-100">Available Real Estate Deals</h1>
        <PriceUpdateTimer variant="compact" />
      </div>

      {/* Control Panel */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Search Input - Sticky on mobile */}
        <div className="relative flex-1 min-w-[200px] max-w-md sticky top-0 z-20 bg-background/95 backdrop-blur sm:static sm:bg-transparent sm:backdrop-blur-none">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            placeholder={`${baseFilteredCities.length} Markets`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-lg border-gray-200 dark:border-slate-700 bg-white dark:bg-card"
            aria-label="Search markets"
          />
        </div>

        {/* Filters Button */}
        <Popover open={showFilters} onOpenChange={setShowFilters}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="rounded-lg border-gray-200 dark:border-slate-700 bg-white dark:bg-card hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-sm"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">Filters</h4>
                {activeFiltersCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-8 text-xs"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
              <Separator />
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm leading-none font-medium">Price Range (USD/{getUnitLabel().toLowerCase()})</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Input
                        type="number"
                        placeholder="Min"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div>
                      <Input
                        type="number"
                        placeholder="Max"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        className="h-9"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* View Toggle Icons */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-lg hover:bg-slate-100"
          >
            <List className="h-5 w-5 text-slate-600" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-lg hover:bg-slate-100"
          >
            <Settings className="h-5 w-5 text-slate-600" />
          </Button>
        </div>
      </div>

      {/* Market Cards Grid - APAC Section */}
      {apacCities.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="scroll-m-20 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              APAC Markets
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsApacExpanded(!isApacExpanded)}
              className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label={isApacExpanded ? "Hide block APAC" : "Show block APAC"}
            >
              {isApacExpanded ? (
                <ChevronUp className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              )}
            </Button>
          </div>
          {isApacExpanded && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" role="list" aria-label="List of APAC real estate markets">
              {apacCities.map((city) => (
                <MarketCard
                  key={city.id}
                  city={city}
                  balance={balance}
                  onTradeComplete={onTradeComplete}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Market Cards Grid - Europe Section */}
      {europeCities.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="scroll-m-20 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              Europe Markets
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsEuropeExpanded(!isEuropeExpanded)}
              className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label={isEuropeExpanded ? "Hide block Europe" : "Show block Europe"}
            >
              {isEuropeExpanded ? (
                <ChevronUp className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              )}
            </Button>
          </div>
          {isEuropeExpanded && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" role="list" aria-label="List of Europe real estate markets">
              {europeCities.map((city) => (
                <MarketCard
                  key={city.id}
                  city={city}
                  balance={balance}
                  onTradeComplete={onTradeComplete}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Market Cards Grid - USA Section */}
      {usaCities.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="scroll-m-20 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              USA Markets
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsUsaExpanded(!isUsaExpanded)}
              className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label={isUsaExpanded ? "Hide block USA" : "Show block USA"}
            >
              {isUsaExpanded ? (
                <ChevronUp className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              )}
            </Button>
          </div>
          {isUsaExpanded && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" role="list" aria-label="List of USA real estate markets">
              {usaCities.map((city) => (
                <MarketCard
                  key={city.id}
                  city={city}
                  balance={balance}
                  onTradeComplete={onTradeComplete}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {apacCities.length === 0 && usaCities.length === 0 && europeCities.length === 0 && (
        <Empty
          title="No markets found"
          description="Try adjusting your search or filters to find more markets"
          icon={<Search className="h-12 w-12 text-muted-foreground" />}
        />
      )}
    </div>
  );
}
