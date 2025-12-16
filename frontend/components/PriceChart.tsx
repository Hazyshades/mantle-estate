import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import type { PricePoint } from "~backend/city/price_history";

interface PriceChartProps {
  data: PricePoint[];
}

export default function PriceChart({ data }: PriceChartProps) {
  // Determine date format based on data range
  const getDateLabel = (timestamp: Date) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    
    // If data is from last 7 days - show time
    if (diffDays < 7) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    // If data is from last year - show date without year
    if (diffDays < 365) {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
    // For longer periods - show date with year
    return date.toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" });
  };

  const chartData = data.map((point) => ({
    time: getDateLabel(point.timestamp),
    date: new Date(point.timestamp),
    price: point.price,
  }));

  const minPrice = Math.min(...data.map((p) => p.price));
  const maxPrice = Math.max(...data.map((p) => p.price));
  const priceRange = maxPrice - minPrice;
  const yMin = minPrice - priceRange * 0.1;
  const yMax = maxPrice + priceRange * 0.1;

  return (
    <ResponsiveContainer width="100%" height={80}>
      <LineChart data={chartData}>
        <XAxis dataKey="time" hide />
        <YAxis domain={[yMin, yMax]} hide />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "6px",
          }}
          labelStyle={{ color: "hsl(var(--popover-foreground))" }}
        />
        <Line type="monotone" dataKey="price" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
