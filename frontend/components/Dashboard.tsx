import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import { useClerk, useUser } from "@clerk/clerk-react";
import { useBackend } from "../lib/useBackend";
import type { City } from "~backend/city/list";
import type { Position } from "~backend/trading/get_positions";
import type { Transaction } from "~backend/trading/get_transactions";
import PositionsList from "./PositionsList";
import TransactionHistory from "./TransactionHistory";
import { Building2, LogOut, Info, AlertCircle, Bell } from "lucide-react";
import MarketList from "./MarketList";
import { Sidebar } from "./Sidebar";
import { ThemeToggle } from "./ThemeToggle";
import { useLocation } from "react-router-dom";

interface DashboardProps {
  userId: string;
}

export default function Dashboard({ userId }: DashboardProps) {
  const [balance, setBalance] = useState<number>(0);
  const [cities, setCities] = useState<City[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  const { toast } = useToast();
  const { signOut } = useClerk();
  const { user } = useUser();
  const backend = useBackend();

  // Initialize activeTab based on current URL
  const [activeTab, setActiveTab] = useState<"markets" | "positions" | "history">(() => {
    if (location.pathname === "/positions") return "positions";
    if (location.pathname === "/history") return "history";
    return "markets";
  });

  // Sync tab with URL path
  useEffect(() => {
    if (location.pathname === "/positions") {
      setActiveTab("positions");
    } else if (location.pathname === "/history") {
      setActiveTab("history");
    } else if (location.pathname === "/" || location.pathname === "/markets") {
      setActiveTab("markets");
    }
  }, [location.pathname]);

  const loadData = async () => {
    try {
      const [balanceRes, citiesRes, positionsRes, transactionsRes] = await Promise.all([
        backend.user.getBalance(),
        backend.city.list(),
        backend.trading.getPositions(),
        backend.trading.getTransactions(),
      ]);

      setBalance(balanceRes.balance);
      setCities(citiesRes.cities);
      setPositions(positionsRes.positions);
      setTransactions(transactionsRes.transactions);
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
  }, [userId]);

  const totalUnrealizedPnl = positions.reduce((sum, pos) => sum + pos.unrealizedPnl, 0);
  const totalRealizedPnl = transactions
    .filter((t) => t.pnl !== null)
    .reduce((sum, t) => sum + (t.pnl || 0), 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <Sidebar 
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
        />
        <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-0 lg:ml-16' : 'ml-0 lg:ml-64'}`}>
          <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur supports-[backdrop-filter]:backdrop-blur shadow-sm">
            <div className="container mx-auto px-4 py-5 flex flex-wrap items-center gap-4 justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-6 w-48" />
                </div>
              </div>
              <Skeleton className="h-9 w-24" />
            </div>
          </header>
          <div className="container mx-auto px-4 py-8 space-y-8">
          <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-r from-white via-primary/5 to-white dark:from-slate-900 dark:via-primary/10 dark:to-slate-900 p-6 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <div className="col-span-1 md:col-span-2 space-y-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-full max-w-xl" />
              </div>
              <Card className="shadow-sm border-border">
                <CardHeader className="pb-2">
                  <Skeleton className="h-3 w-20" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-24" />
                </CardContent>
              </Card>
              <Card className="shadow-sm border-border">
                <CardHeader className="pb-2">
                  <Skeleton className="h-3 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-12" />
                  <Skeleton className="h-3 w-32 mt-2" />
                </CardContent>
              </Card>
              <Card className="shadow-sm border-border">
                <CardHeader className="pb-2">
                  <Skeleton className="h-3 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-3 w-32 mt-2" />
                </CardContent>
              </Card>
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100">
      <Sidebar 
        positionsCount={positions.length} 
        onTabChange={setActiveTab}
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />
      
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-0 lg:ml-16' : 'ml-0 lg:ml-64'}`}>
        <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur supports-[backdrop-filter]:backdrop-blur shadow-sm">
          <div className="container mx-auto px-4 py-5 flex flex-wrap items-center gap-4 justify-between">
            <div className="flex items-center gap-3">
              <img src="/images/logos/main_page.png" alt="Logo" className="h-12 w-12 rounded-full" />
              <div>
                <p className="text-sm leading-none font-medium text-muted-foreground uppercase tracking-[0.12em]">Synthetic Real Estate</p>
                <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight text-balance">Trading Desk</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" aria-label="Notifications">
                <Bell className="h-5 w-5" />
                <span className="sr-only">Notifications</span>
              </Button>
              <ThemeToggle />
              {user && (
                <div className="flex items-center gap-2">
                  <Avatar>
                    <AvatarImage src={user.imageUrl} alt={user.fullName || ""} />
                    <AvatarFallback>
                      {user.firstName?.[0] || user.emailAddresses[0]?.emailAddress[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm leading-none font-medium text-muted-foreground hidden sm:inline">
                    {user.fullName || user.emailAddresses[0]?.emailAddress}
                  </span>
                </div>
              )}
              <Button variant="outline" onClick={() => signOut()} aria-label="Exit from account">
                <LogOut className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8 space-y-8">
       {/* } {balance < 1000 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Low Balance</AlertTitle>
            <AlertDescription>
              Your balance is below $1,000. Consider adding funds to continue trading.
            </AlertDescription>
          </Alert>
        )} */} 
        <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-r from-white via-primary/5 to-white dark:from-slate-900 dark:via-primary/10 dark:to-slate-900 p-6 shadow-sm">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary))/0.4,transparent_35%),radial-gradient(circle_at_80%_0%,hsl(var(--primary))/0.3,transparent_30%)]" />
          <div className="relative grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="col-span-1 md:col-span-2 space-y-2">
              <p className="text-sm leading-none font-medium text-muted-foreground">Portfolio</p>
              <h2 className="scroll-m-20 border-b border-border pb-2 text-3xl font-semibold tracking-tight first:mt-0 text-foreground">Summary metrics</h2>
              <p className="leading-7 text-muted-foreground max-w-xl [&:not(:first-child)]:mt-6">
                Track synthetic real estate markets, open long or short positions, and monitor P&amp;L in one place.
              </p>
            </div>
            <Card className="shadow-sm border-border">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-1">
                  <CardTitle className="text-xs uppercase text-muted-foreground">Balance</CardTitle>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Your available trading balance</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold text-card-foreground">${balance.toFixed(2)}</div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-border">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-1">
                  <CardTitle className="text-xs uppercase text-muted-foreground">Open positions</CardTitle>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Number of active positions and unrealized profit/loss</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold text-card-foreground">{positions.length}</div>
                <p className="text-sm leading-none font-medium text-muted-foreground">
                  Unrealized P&amp;L:{" "}
                  <span className={totalUnrealizedPnl >= 0 ? "text-green-400 dark:text-green-500" : "text-red-400 dark:text-red-500"}>
                    ${totalUnrealizedPnl.toFixed(2)}
                  </span>
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-border">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-1">
                  <CardTitle className="text-xs uppercase text-muted-foreground">Realized P&amp;L</CardTitle>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Total profit/loss from closed positions</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-lg font-semibold ${totalRealizedPnl >= 0 ? "text-green-400 dark:text-green-500" : "text-red-400 dark:text-red-500"}`}>
                  ${totalRealizedPnl.toFixed(2)}
                </div>
                <p className="text-sm leading-none font-medium text-muted-foreground">From closed trades</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="markets">Markets</TabsTrigger>
            <TabsTrigger value="positions">Positions ({positions.length})</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="markets" className="space-y-6">
            <MarketList cities={cities} balance={balance} onTradeComplete={loadData} />
          </TabsContent>

          <TabsContent value="positions">
            <PositionsList positions={positions} cities={cities} onCloseComplete={loadData} />
          </TabsContent>

          <TabsContent value="history">
            <TransactionHistory transactions={transactions} />
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </div>
  );
}
