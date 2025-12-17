import { api } from "encore.dev/api";

export interface NextUpdateResponse {
  nextUpdateTime: string; // ISO timestamp
  timeUntilUpdate: number; // milliseconds until next update
}

/**
 * Calculate the next update time (every 6 hours, rounded to nearest 6-hour interval)
 */
function getNextUpdateTime(): Date {
  const now = new Date();
  const hours = now.getUTCHours();
  
  // Round up to the next 6-hour interval (0, 6, 12, 18)
  const nextHours = Math.ceil((hours + 1) / 6) * 6;
  
  const nextUpdate = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    nextHours >= 24 ? 0 : nextHours,
    0, // Minutes
    0, // Seconds
    0  // Milliseconds
  ));
  
  // If we've passed midnight (e.g., nextHours = 24), move to next day
  if (nextHours >= 24) {
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
