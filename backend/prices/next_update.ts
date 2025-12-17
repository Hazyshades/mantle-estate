import { api } from "encore.dev/api";

export interface NextUpdateResponse {
  nextUpdateTime: string; // ISO timestamp
  timeUntilUpdate: number; // milliseconds until next update
}

/**
 * Calculate the next update time (every 5 minutes, rounded to nearest 5-minute interval)
 */
function getNextUpdateTime(): Date {
  const now = new Date();
  const minutes = now.getUTCMinutes();
  
  // Round up to the next 5-minute interval
  const nextMinutes = Math.ceil((minutes + 1) / 5) * 5;
  
  const nextUpdate = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    now.getUTCHours(),
    nextMinutes,
    0, // Seconds
    0  // Milliseconds
  ));
  
  // If we've passed the hour (e.g., nextMinutes = 60), move to next hour
  if (nextMinutes >= 60) {
    nextUpdate.setUTCHours(nextUpdate.getUTCHours() + 1);
    nextUpdate.setUTCMinutes(0);
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
