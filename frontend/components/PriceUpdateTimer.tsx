import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBackend } from "@/lib/useBackend";

interface PriceUpdateTimerProps {
  className?: string;
  variant?: "default" | "compact";
}

interface NextUpdateResponse {
  nextUpdateTime: string; // ISO timestamp
  timeUntilUpdate: number; // milliseconds until next update
}

// Price update schedule: updates occur at 0:00, 6:00, 12:00, 18:00 UTC
const PRICE_UPDATE_HOURS = [0, 6, 12, 18];

/**
 * Calculate next update time client-side (fallback when API is unavailable)
 * Matches the cron schedule: every 6 hours at 0:00, 6:00, 12:00, 18:00 UTC
 */
function getNextUpdateTimeFallback(): Date {
  const now = new Date();
  const currentHour = now.getUTCHours();
  const currentMinute = now.getUTCMinutes();
  const currentSecond = now.getUTCSeconds();
  const currentMs = now.getUTCMilliseconds();
  
  // Check if we're exactly at an update time (within 1 second tolerance)
  // If so, we want the NEXT update, not the current one
  const isAtUpdateTime = PRICE_UPDATE_HOURS.includes(currentHour) && 
                         currentMinute === 0 && 
                         currentSecond === 0 && 
                         currentMs < 1000;
  
  // Find the next update hour from the schedule [0, 6, 12, 18]
  let nextUpdateHour: number | null = null;
  
  // Find the first hour in the schedule that is strictly after the current hour
  for (const hour of PRICE_UPDATE_HOURS) {
    if (hour > currentHour) {
      nextUpdateHour = hour;
      break;
    }
  }
  
  // If no hour found in today, use the first hour of the next day
  // This happens when currentHour >= 18 (or we're at an update time and need the next day's first update)
  if (nextUpdateHour === null || (isAtUpdateTime && nextUpdateHour === currentHour)) {
    nextUpdateHour = PRICE_UPDATE_HOURS[0];
  }
  
  const nextUpdate = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    nextUpdateHour,
    0, // Minutes
    0, // Seconds
    0  // Milliseconds
  ));
  
  // If we've wrapped around to the next day
  if (nextUpdateHour <= currentHour || (isAtUpdateTime && nextUpdateHour === currentHour)) {
    nextUpdate.setUTCDate(nextUpdate.getUTCDate() + 1);
  }
  
  return nextUpdate;
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
  const backend = useBackend();
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [nextUpdateTime, setNextUpdateTime] = useState<Date | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let nextUpdate: Date | null = null;
    let interval: ReturnType<typeof setInterval> | null = null;

    // Fetch next update time from API
    const fetchNextUpdate = async () => {
      try {
        const data = await backend.prices.nextUpdate();
        nextUpdate = new Date(data.nextUpdateTime);
        setNextUpdateTime(nextUpdate);
        setTimeRemaining(data.timeUntilUpdate);
        setError(null);
      } catch (err) {
        // Fallback to client-side calculation if API is not available
        console.warn("Failed to fetch next update time from API, using client-side calculation:", err);
        nextUpdate = getNextUpdateTimeFallback();
        setNextUpdateTime(nextUpdate);
        const now = new Date();
        const remaining = nextUpdate.getTime() - now.getTime();
        setTimeRemaining(Math.max(0, remaining));
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
      <div className={cn("flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400", className)}>
        <Clock className="h-4 w-4 text-slate-500 dark:text-slate-400" />
        <div className="flex flex-col">
          <span className="text-xs text-slate-600 dark:text-slate-400">Next price update</span>
          <span className={cn(
            "text-sm font-medium",
            isUpdating ? "text-green-600 dark:text-green-500" : "text-slate-900 dark:text-white"
          )}>
            {displayText}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "flex items-center justify-center gap-2 px-3 py-2 rounded-lg border",
        "bg-slate-100 dark:bg-slate-800",
        "border-slate-300 dark:border-slate-700",
        "text-slate-900 dark:text-slate-100",
        className
      )}
    >
      <Clock className="h-4 w-4 text-slate-500 dark:text-slate-400" />
      <div className="flex flex-col">
        <span className="text-xs text-slate-600 dark:text-slate-400">Next price update</span>
        <span className={cn(
          "text-sm font-medium",
          isUpdating ? "text-green-600 dark:text-green-500" : "text-slate-900 dark:text-white"
        )}>
          {displayText}
        </span>
      </div>
      {nextUpdateTime && !isUpdating && (
        <span className="text-xs text-slate-500 dark:text-slate-500 ml-auto">
          {nextUpdateTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", timeZone: "UTC" })} UTC
        </span>
      )}
    </div>
  );
}
