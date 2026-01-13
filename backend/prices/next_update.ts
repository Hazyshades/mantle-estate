import { api } from "encore.dev/api";
import { PRICE_UPDATE_HOURS } from "./calculations";

export interface NextUpdateResponse {
  nextUpdateTime: string; // ISO timestamp
  timeUntilUpdate: number; // milliseconds until next update
}

/**
 * Calculate the next update time based on the cron schedule
 * Updates occur at 0:00, 6:00, 12:00, 18:00 UTC (every 6 hours)
 */
function getNextUpdateTime(): Date {
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

// API endpoint that returns the next scheduled update time
export const nextUpdate = api<void, NextUpdateResponse>(
  { expose: true, method: "GET", path: "/prices/next-update" },
  async (): Promise<NextUpdateResponse> => {
    const nextUpdateTime = getNextUpdateTime();
    const now = new Date();
    const timeUntilUpdate = nextUpdateTime.getTime() - now.getTime();
    
    return {
      nextUpdateTime: nextUpdateTime.toISOString(),
      timeUntilUpdate: Math.max(0, timeUntilUpdate), // Ensure non-negative
    };
  }
);

