import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { useClerk } from "@clerk/clerk-react";
import { useBackend } from "../lib/useBackend";
import type { City } from "~backend/city/list";
import type { Position } from "~backend/trading/get_positions";
import type { Transaction } from "~backend/trading/get_transactions";
import CityGrid from "./CityGrid";
import PositionsList from "./PositionsList";
import TransactionHistory from "./TransactionHistory";
import { Building2, LogOut, TrendingUp, Wallet } from "lucide-react";

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Building2 className="h-12 w-12 animate-pulse mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading your portfolio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold">Real Estate Trading</h1>
            </div>
            <Button variant="outline" onClick={() => signOut()}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Balance</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${balance.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Open Positions</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{positions.length}</div>
              <p className="text-xs text-muted-foreground">
                Unrealized P&L:{" "}
                <span className={totalUnrealizedPnl >= 0 ? "text-green-500" : "text-red-500"}>
                  ${totalUnrealizedPnl.toFixed(2)}
                </span>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${totalRealizedPnl >= 0 ? "text-green-500" : "text-red-500"}`}>
                ${totalRealizedPnl.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">Realized from closed positions</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="markets" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="markets">Markets</TabsTrigger>
            <TabsTrigger value="positions">Positions ({positions.length})</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="markets">
            <CityGrid cities={cities} balance={balance} onTradeComplete={loadData} />
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
