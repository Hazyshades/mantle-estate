import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Empty } from "@/components/ui/empty";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/use-toast";
import { useBackend } from "../lib/useBackend";
import type { Transaction } from "~backend/trading/get_transactions";
import { Download, History } from "lucide-react";
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
      <Empty
        title="No transaction history"
        description="Your trades will appear here once you start trading. Close a position to see your transaction history."
        icon={<History className="h-12 w-12 text-muted-foreground" />}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="scroll-m-20 text-3xl font-semibold tracking-tight">Transaction History</CardTitle>
          <Button onClick={handleExport} disabled={isExporting} size="sm">
            {isExporting ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Fee</TableHead>
                <TableHead>P&L</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    <Badge variant={getTypeVariant(transaction.transactionType)}>
                      {getTypeLabel(transaction.transactionType)}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{transaction.cityName}</TableCell>
                  <TableCell>{transaction.quantity.toFixed(2)} sqm</TableCell>
                  <TableCell>${transaction.price.toFixed(2)}</TableCell>
                  <TableCell>${transaction.fee.toFixed(2)}</TableCell>
                  <TableCell>
                    {transaction.pnl !== null ? (
                      <span className={transaction.pnl >= 0 ? "text-green-500 font-medium" : "text-red-500 font-medium"}>
                        {transaction.pnl >= 0 ? "+" : ""}${transaction.pnl.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(transaction.timestamp).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
