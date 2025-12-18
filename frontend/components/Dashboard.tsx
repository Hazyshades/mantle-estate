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
import { Building2, LogOut, Info, AlertCircle } from "lucide-react";
import MarketList from "./MarketList";

interface DashboardProps {
  userId: string;
}

export default function Dashboard({ userId }: DashboardProps) {
  const [balance, setBalance] = useState<number>(0);
  const [cities, setCities] = useState<City[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { signOut } = useClerk();
  const { user } = useUser();
  const backend = useBackend();

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
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
        <header className="border-b border-border bg-white/90 backdrop-blur supports-[backdrop-filter]:backdrop-blur shadow-sm">
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
          <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-r from-white via-primary/5 to-white p-6 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="col-span-1 md:col-span-2 space-y-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-full max-w-xl" />
              </div>
              <Card className="bg-white shadow-sm border-border">
                <CardHeader className="pb-2">
                  <Skeleton className="h-3 w-20" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-24" />
                </CardContent>
              </Card>
              <Card className="bg-white shadow-sm border-border">
                <CardHeader className="pb-2">
                  <Skeleton className="h-3 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-12" />
                  <Skeleton className="h-3 w-32 mt-2" />
                </CardContent>
              </Card>
              <Card className="bg-white shadow-sm border-border">
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
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900">
      <header className="border-b border-border bg-white/90 backdrop-blur supports-[backdrop-filter]:backdrop-blur shadow-sm">
        <div className="container mx-auto px-4 py-5 flex flex-wrap items-center gap-4 justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/15 p-3 text-primary">
              <Building2 className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm leading-none font-medium text-muted-foreground uppercase tracking-[0.12em]">Synthetic Real Estate</p>
              <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight text-balance">Real Estate Trading Desk</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
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
            <Button variant="outline" onClick={() => signOut()}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {balance < 1000 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Low Balance</AlertTitle>
            <AlertDescription>
              Your balance is below $1,000. Consider adding funds to continue trading.
            </AlertDescription>
          </Alert>
        )}
        <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-r from-white via-primary/5 to-white p-6 shadow-sm">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary))/0.4,transparent_35%),radial-gradient(circle_at_80%_0%,hsl(var(--primary))/0.3,transparent_30%)]" />
          <div className="relative grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="col-span-1 md:col-span-2 space-y-2">
              <p className="text-sm leading-none font-medium text-muted-foreground">Summary metrics</p>
              <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">Welcome back</h2>
              <p className="leading-7 text-muted-foreground max-w-xl [&:not(:first-child)]:mt-6">
                Track synthetic real estate markets, open long or short positions, and monitor P&amp;L in one place.
              </p>
            </div>
            <Card className="bg-white shadow-sm border-border">
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
                <div className="text-lg font-semibold">${balance.toFixed(2)}</div>
              </CardContent>
            </Card>
            <Card className="bg-white shadow-sm border-border">
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
                <div className="text-lg font-semibold">{positions.length}</div>
                <p className="text-sm leading-none font-medium text-muted-foreground">
                  Unrealized P&amp;L:{" "}
                  <span className={totalUnrealizedPnl >= 0 ? "text-green-400" : "text-red-400"}>
                    ${totalUnrealizedPnl.toFixed(2)}
                  </span>
                </p>
              </CardContent>
            </Card>
            <div className="hidden md:block"></div>
            <div className="hidden md:block"></div>
            <div className="md:col-start-3 md:col-span-2 flex justify-center">
              <Card className="bg-white shadow-sm border-border max-w-[calc(25%-1.125rem)] w-full">
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
                  <div className={`text-lg font-semibold ${totalRealizedPnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                    ${totalRealizedPnl.toFixed(2)}
                  </div>
                  <p className="text-sm leading-none font-medium text-muted-foreground">From closed trades</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <Tabs defaultValue="markets" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="markets">Markets</TabsTrigger>
            <TabsTrigger value="positions">Positions ({positions.length})</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="markets" className="space-y-6">
            <MarketList cities={cities} balance={balance} onTradeComplete={loadData} />
          </TabsContent>

          <TabsContent value="positions">
            <PositionsList positions={positions} onCloseComplete={loadData} />
          </TabsContent>

          <TabsContent value="history">
            <TransactionHistory transactions={transactions} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
