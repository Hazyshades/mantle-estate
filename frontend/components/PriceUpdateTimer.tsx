import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface PriceUpdateTimerProps {
  className?: string;
  variant?: "default" | "compact";
}

interface NextUpdateResponse {
  nextUpdateTime: string; // ISO timestamp
  timeUntilUpdate: number; // milliseconds until next update
}

/**
 * Formats time remaining in a human-readable format
 */
function formatTimeRemaining(ms: number): string {
  if (ms <= 0) {
    return "Updating now...";
  }

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const remainingHours = hours % 24;
  const remainingMinutes = minutes % 60;
  const remainingSeconds = seconds % 60;

  if (days > 0) {
    return `${days}d ${remainingHours}h ${remainingMinutes}m`;
  }
  if (hours > 0) {
    return `${hours}h ${remainingMinutes}m ${remainingSeconds}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${remainingSeconds}s`;
}

export default function PriceUpdateTimer({ className, variant = "default" }: PriceUpdateTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [nextUpdateTime, setNextUpdateTime] = useState<Date | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let nextUpdate: Date | null = null;
    let interval: NodeJS.Timeout | null = null;

    // Fetch next update time from API
    const fetchNextUpdate = async () => {
      try {
        // Use the base URL from the backend client
        const baseURL = import.meta.env.VITE_CLIENT_TARGET || "http://localhost:4000";
        const response = await fetch(`${baseURL}/prices/next-update`);
        if (response.ok) {
          const data: NextUpdateResponse = await response.json();
          nextUpdate = new Date(data.nextUpdateTime);
          setNextUpdateTime(nextUpdate);
          setTimeRemaining(data.timeUntilUpdate);
          setError(null);
        } else {
          throw new Error("Failed to fetch next update time");
        }
      } catch (err) {
        // Fallback to client-side calculation if API is not available
        console.warn("Failed to fetch next update time from API, using client-side calculation:", err);
        const now = new Date();
        nextUpdate = new Date(Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate() + 1,
          0, 0, 0, 0
        ));
        setNextUpdateTime(nextUpdate);
        const remaining = nextUpdate.getTime() - now.getTime();
        setTimeRemaining(remaining);
        setError(null);
      }
    };

    // Initial fetch
    fetchNextUpdate();

    // Update timer every second
    interval = setInterval(() => {
      if (nextUpdate) {
        const now = new Date();
        const remaining = nextUpdate.getTime() - now.getTime();
        setTimeRemaining(remaining);
        
        // If update time has passed, fetch next update time
        if (remaining <= 0) {
          setIsUpdating(true);
          fetchNextUpdate();
          
          // Reset updating state after a short delay
          setTimeout(() => {
            setIsUpdating(false);
          }, 5000);
        }
      }
    }, 1000);

    // Refresh next update time every hour to stay in sync
    const refreshInterval = setInterval(() => {
      fetchNextUpdate();
    }, 60 * 60 * 1000); // Every hour

    return () => {
      if (interval) clearInterval(interval);
      clearInterval(refreshInterval);
    };
  }, []);

  const displayText = isUpdating ? "Updating now..." : formatTimeRemaining(timeRemaining);

  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-2 text-sm text-slate-400", className)}>
        <Clock className="h-4 w-4" />
        <span>{displayText}</span>
      </div>
    );
  }

  return (
    <div 
      className={cn("flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 rounded-lg border", className)}
      style={{
        borderColor: "var(--card-foreground)",
        borderImage: "none",
        color: "rgba(229, 220, 220, 1)"
      }}
    >
      <Clock className="h-4 w-4 text-slate-400" />
      <div className="flex flex-col">
        <span className="text-xs text-slate-400">Next price update</span>
        <span className={cn(
          "text-sm font-medium",
          isUpdating ? "text-green-500" : "text-white"
        )}>
          {displayText}
        </span>
      </div>
      {nextUpdateTime && !isUpdating && (
        <span className="text-xs text-slate-500 ml-auto">
          {nextUpdateTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", timeZone: "UTC" })} UTC
        </span>
      )}
    </div>
  );
}
