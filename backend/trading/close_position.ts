import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { closePositionInternal, type ClosePositionResponse } from "./close_position_internal";

interface ClosePositionRequest {
  positionId: number;
}

// Close an open position
export const closePosition = api<ClosePositionRequest, ClosePositionResponse>(
  { auth: true, expose: true, method: "POST", path: "/trading/close/:positionId" },
  async ({ positionId }) => {
    const auth = getAuthData()!;
    const userId = auth.userID;
    return await closePositionInternal(userId, positionId);

  }
);
