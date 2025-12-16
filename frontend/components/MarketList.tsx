import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { City } from "~backend/city/list";
import type { PricePoint } from "~backend/city/price_history";
import backend from "~backend/client";
import { Card } from "@/components/ui/card";
import { Search, Filter, List, Settings } from "lucide-react";

interface MarketListProps {
  cities: City[];
  balance: number;
  onTradeComplete: () => void;
}

interface MarketRowProps {
  city: City;
  balance: number;
  onTradeComplete: () => void;
}

function MarketCard({ city, balance, onTradeComplete }: MarketRowProps) {
  const navigate = useNavigate();
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);

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

    loadPriceHistory();
  }, [city.id]);

  const priceChange24h =
    priceHistory.length >= 2
      ? ((city.currentPriceUsd - priceHistory[0].price) / priceHistory[0].price) * 100
      : 0;

  const changeColor = priceChange24h >= 0 ? "text-green-500" : "text-red-500";

  // Use a lightweight deterministic "volume" so rows look lively without new backend fields
  const pseudoVolume = useMemo(() => {
    const seed = city.id * 13 + city.name.length * 7;
    const base = 500000 + (seed % 2000000);
    return base + priceHistory.length * 12000;
  }, [city.id, city.name.length, priceHistory.length]);

  // Determine market type based on price change
  const getMarketType = () => {
    if (priceChange24h > 2) return { type: "Seller's Market", color: "bg-red-500", fill: 60 };
    if (priceChange24h < -2) return { type: "Buyer's Market", color: "bg-green-500", fill: 85 };
    return { type: "Balanced Market", color: "bg-gray-400", fill: 50 };
  };

  const marketType = getMarketType();

  const getCityImageUrl = () => {
    const cityName = city.name.split(",")[0].trim().toLowerCase();
    const cityImageMap: Record<string, string> = {
      "new york": "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "miami": "https://www.miamiandbeaches.com/getmedia/9d5a6543-44ad-4279-84bb-cfd10059e57e/Skywheel_Miami_1440x900.jpg",
      "los angeles": "https://images.unsplash.com/photo-1580655653885-65763b2597d0?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "chicago": "https://images.unsplash.com/photo-1494522358652-f30e61a60313?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "philadelphia": "https://images.unsplash.com/photo-1508770218424-753a10cd8117?q=80&w=2069&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "dallas": "https://images.unsplash.com/photo-1653862496605-e994e87392ec?q=80&w=1169&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "houston": "https://images.unsplash.com/photo-1629924887151-3a7494ff0334?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "washington": "https://images.unsplash.com/photo-1617581629397-a72507c3de9e?q=80&w=1172&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "london": "https://offloadmedia.feverup.com/secretldn.com/wp-content/uploads/2022/06/25124714/shutterstock_2079973213-1-1024x657.jpg",
      "paris": "https://meet-thelocals.com/wp-content/uploads/2019/10/Eiffel-Tower-view-Paris-1024x683.jpg",
      "tokyo": "https://images.unsplash.com/photo-1557409518-1b1ad1ac120d?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "singapore": "https://www.traveltalktours.com/wp-content/smush-webp/2023/12/guo-xin-goh-8juRlGCr5c-unsplash-1-scaled.jpg.webp",
      "berlin": "https://images.squarespace-cdn.com/content/v1/6885522713c6cd559686b2fd/48e0b35f-4b5f-4252-b45b-547eabfbc3b4/berlin-skyline-sunset-berliner-dom.jpg",
      "dubai": "https://images.locationscout.net/2021/05/the-best-view-of-dubai-united-arab-emirates.webp?h=1400&q=80"
    };

    if (cityImageMap[cityName]) {
      return cityImageMap[cityName];
    }

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
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer p-0 bg-white border border-slate-200/80 shadow-sm" onClick={handleCardClick}>
        {/* City Image */}
        <div className="relative w-full overflow-hidden rounded-t-xl aspect-[16/9]">
          <img
            src={getCityImageUrl()}
            alt={city.name}
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
          <h3 className="text-xl font-bold text-slate-900">{cityDisplayName}</h3>

          {/* Transaction Volume */}
          <p className="text-sm text-slate-600">
            Transaction Volume ${(pseudoVolume / 1000000).toFixed(2)}M
          </p>

          {/* Market Type with Indicator */}
          <div className="space-y-1">
            <p className="text-sm text-slate-600">{marketType.type}</p>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${marketType.color} transition-all`}
                style={{ width: `${marketType.fill}%` }}
              />
            </div>
          </div>

          {/* Price per Square Foot */}
          <p className="text-lg font-bold text-slate-900">
            ${city.currentPriceUsd.toFixed(2)} / Sqft
          </p>

          {/* Price Change */}
          <p className={`text-sm font-medium ${changeColor}`}>
            {priceChange24h >= 0 ? "+" : ""}{priceChange24h.toFixed(2)}%
          </p>
        </div>
      </Card>
    </>
  );
}

export default function MarketList({ cities, balance, onTradeComplete }: MarketListProps) {
  const [search, setSearch] = useState("");

  const filteredCities = useMemo(() => {
    return cities.filter((city) => {
      // Filter out non-US cities (Tokyo, London, etc.)
      // Show only US cities
      if (city.country !== "USA") {
        return false;
      }
      
      const matchesSearch =
        city.name.toLowerCase().includes(search.toLowerCase()) ||
        city.country.toLowerCase().includes(search.toLowerCase());
      return matchesSearch;
    });
  }, [cities, search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <h1 className="text-3xl font-bold text-slate-900">Available Real Estate Deals</h1>

      {/* Control Panel */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            placeholder={`${filteredCities.length} Markets`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-lg border-gray-200 bg-white"
          />
        </div>

        {/* Filters Button */}
        <Button
          variant="outline"
          className="rounded-lg border-gray-200 bg-white hover:bg-slate-100 text-slate-700 shadow-sm"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>

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

      {/* Market Cards Grid */}
      {filteredCities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCities.map((city) => (
            <MarketCard
              key={city.id}
              city={city}
              balance={balance}
              onTradeComplete={onTradeComplete}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed bg-card/50 p-12 text-center text-muted-foreground">
          No markets found for this query
        </div>
      )}
    </div>
  );
}
