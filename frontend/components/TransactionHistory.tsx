import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useBackend } from "../lib/useBackend";
import type { Transaction } from "~backend/trading/get_transactions";
import { Download } from "lucide-react";
import { useState } from "react";

interface TransactionHistoryProps {
  transactions: Transaction[];
}

export default function TransactionHistory({ transactions }: TransactionHistoryProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();
  const backend = useBackend();

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await backend.trading.exportTransactions();

      const blob = new Blob([response.csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `transactions_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export successful",
        description: "Your transaction history has been downloaded",
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "Please try again",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "buy":
        return "Buy Long";
      case "sell":
        return "Sell Long";
      case "short_open":
        return "Open Short";
      case "short_close":
        return "Close Short";
      default:
        return type;
    }
  };

  const getTypeVariant = (type: string): "default" | "secondary" => {
    return type === "buy" || type === "short_close" ? "default" : "secondary";
  };

  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No transaction history</p>
          <p className="text-sm text-muted-foreground mt-2">Your trades will appear here</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Transaction History</CardTitle>
          <Button onClick={handleExport} disabled={isExporting} size="sm">
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? "Exporting..." : "Export CSV"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {transactions.map((transaction) => (
            <div key={transaction.id} className="flex items-center justify-between p-4 rounded-lg border border-border">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={getTypeVariant(transaction.transactionType)}>{getTypeLabel(transaction.transactionType)}</Badge>
                  <span className="font-medium">{transaction.cityName}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Quantity</p>
                    <p>{transaction.quantity.toFixed(2)} sqm</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Price</p>
                    <p>${transaction.price.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Fee</p>
                    <p>${transaction.fee.toFixed(2)}</p>
                  </div>
                  {transaction.pnl !== null && (
                    <div>
                      <p className="text-muted-foreground">P&L</p>
                      <p className={transaction.pnl >= 0 ? "text-green-500" : "text-red-500"}>
                        {transaction.pnl >= 0 ? "+" : ""}${transaction.pnl.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(transaction.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
