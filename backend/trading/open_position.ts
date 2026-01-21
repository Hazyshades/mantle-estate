import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { openPositionInternal, type OpenPositionRequest, type OpenPositionResponse } from "./open_position_internal";

// Open a new position (buy/short)
export const openPosition = api<OpenPositionRequest, OpenPositionResponse>(
  { auth: true, expose: true, method: "POST", path: "/trading/open" },
  async (req) => {
    const auth = getAuthData()!;
    const userId = auth.userID;
    return await openPositionInternal(userId, req);

  }
);
