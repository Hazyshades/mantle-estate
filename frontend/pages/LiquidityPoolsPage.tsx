import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { useBackend } from "../lib/useBackend";
import { Sidebar } from "../components/Sidebar";
import { ThemeToggle } from "../components/ThemeToggle";
import LiquidityPoolCard from "../components/LiquidityPoolCard";
import LpPositionsList from "../components/LpPositionsList";
import type { City } from "~backend/city/list";
import { useUser } from "@clerk/clerk-react";
import { useClerk } from "@clerk/clerk-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Building2, LogOut, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

// APAC countries list
const APAC_COUNTRIES = [
  "Japan",
  "Singapore",
  "Hong Kong",
  "China",
  "Australia",
  "South Korea",
];

// Europe cities list
const EUROPE_CITIES = [
  "London",
  "Paris",
  "Berlin",
];

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

export default function LiquidityPoolsPage() {
  const [balance, setBalance] = useState<number>(0);
  const [cities, setCities] = useState<City[]>([]);
  const [lpPositions, setLpPositions] = useState<UserLpPosition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isUsaExpanded, setIsUsaExpanded] = useState(true);
  const [isApacExpanded, setIsApacExpanded] = useState(true);
  const [isEuropeExpanded, setIsEuropeExpanded] = useState(true);
  const { toast } = useToast();
  const { signOut } = useClerk();
  const { user } = useUser();
  const backend = useBackend();

  // Separate cities into APAC, USA, and Europe
  const { apacCities, usaCities, europeCities } = useMemo(() => {
    const apac: typeof cities = [];
    const usa: typeof cities = [];
    const europe: typeof cities = [];

    cities.forEach((city) => {
      if (city.country === "USA") {
        usa.push(city);
      } else if (APAC_COUNTRIES.includes(city.country)) {
        apac.push(city);
      } else if (EUROPE_CITIES.includes(city.name)) {
        europe.push(city);
      }
    });

    return { apacCities: apac, usaCities: usa, europeCities: europe };
  }, [cities]);

  const loadData = async () => {
    try {
      const [balanceRes, citiesRes, lpPositionsRes] = await Promise.all([
        backend.user.getBalance(),
        backend.city.list(),
        backend.liquidityPools.getUserLp(),
      ]);

      setBalance(balanceRes.balance);
      setCities(citiesRes.cities);
      setLpPositions(lpPositionsRes.positions);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        variant: "destructive",
        title: "Error loading data",
        description: "Please refresh the page",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleDepositComplete = () => {
    loadData();
  };

  const handleWithdrawComplete = () => {
    loadData();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <Sidebar 
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
        />
        <div className={`transition-all duration-300 ${sidebarCollapsed ? "ml-16" : "ml-64"}`}>
          <div className="p-8">
            <Skeleton className="h-8 w-64 mb-4" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Sidebar 
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />
      <div className={`transition-all duration-300 ${sidebarCollapsed ? "ml-16" : "ml-64"}`}>
        {/* Header */}
        <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-16 items-center justify-between px-8">
            <div className="flex items-center gap-4">
              <Building2 className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Liquidity Pools</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Balance</p>
                <p className="text-lg font-semibold">${balance.toFixed(2)}</p>
              </div>
              <ThemeToggle />
              {user && (
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={user.imageUrl} alt={user.fullName || ""} />
                    <AvatarFallback>
                      {user.fullName?.charAt(0) || user.emailAddresses[0]?.emailAddress.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => signOut()}
                    title="Sign out"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-8">
          <Tabs defaultValue="pools" className="space-y-6">
            <TabsList>
              <TabsTrigger value="pools">All Pools</TabsTrigger>
              <TabsTrigger value="positions">My Positions</TabsTrigger>
            </TabsList>

            <TabsContent value="pools" className="space-y-6">
              <div className="space-y-8">
                <h2 className="text-xl font-semibold">Available Liquidity Pools</h2>

                {/* APAC Section */}
                {apacCities.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                        APAC Pools
                      </h3>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsApacExpanded(!isApacExpanded)}
                        className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        aria-label={isApacExpanded ? "Hide APAC markets" : "Show APAC markets"}
                      >
                        {isApacExpanded ? (
                          <ChevronUp className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                        )}
                      </Button>
                    </div>
                    {isApacExpanded && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {apacCities.map((city) => (
                          <LiquidityPoolCard
                            key={city.id}
                            city={city}
                            balance={balance}
                            onDepositComplete={handleDepositComplete}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Europe Section */}
                {europeCities.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                        Europe Pools
                      </h3>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsEuropeExpanded(!isEuropeExpanded)}
                        className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        aria-label={isEuropeExpanded ? "Hide Europe markets" : "Show Europe markets"}
                      >
                        {isEuropeExpanded ? (
                          <ChevronUp className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                        )}
                      </Button>
                    </div>
                    {isEuropeExpanded && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {europeCities.map((city) => (
                          <LiquidityPoolCard
                            key={city.id}
                            city={city}
                            balance={balance}
                            onDepositComplete={handleDepositComplete}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* USA Section */}
                {usaCities.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                        USA Pools
                      </h3>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsUsaExpanded(!isUsaExpanded)}
                        className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        aria-label={isUsaExpanded ? "Hide USA markets" : "Show USA markets"}
                      >
                        {isUsaExpanded ? (
                          <ChevronUp className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                        )}
                      </Button>
                    </div>
                    {isUsaExpanded && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {usaCities.map((city) => (
                          <LiquidityPoolCard
                            key={city.id}
                            city={city}
                            balance={balance}
                            onDepositComplete={handleDepositComplete}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="positions" className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">My Liquidity Positions</h2>
                <LpPositionsList
                  positions={lpPositions}
                  onWithdrawComplete={handleWithdrawComplete}
                />
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
