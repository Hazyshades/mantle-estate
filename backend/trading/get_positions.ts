import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { getPositionsInternal, type Position } from "./get_positions_internal";

interface GetPositionsResponse {
  positions: Position[];
}

// Get user's open positions
export const getPositions = api<void, GetPositionsResponse>(
  { auth: true, expose: true, method: "GET", path: "/trading/positions" },
  async () => {
    const auth = getAuthData()!;
    const userId = auth.userID;
    const positions = await getPositionsInternal(userId);
    return { positions };
  }
);

// Re-export internal function and types for use by other services
export { getPositionsInternal, type Position };
