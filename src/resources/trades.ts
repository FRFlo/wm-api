import type { ApiTransport } from "../transport";
import type { CreateTradeRequest } from "../client";
import type { TradeResponse, TradesResponse } from "../types";

export const getTrades = (
	transport: ApiTransport,
	query?: { active?: number },
): Promise<TradesResponse> => transport.request("trades", { method: "GET" }, query);
export const createTrade = (
	transport: ApiTransport,
	body: CreateTradeRequest,
): Promise<TradeResponse> => transport.request("trades", { method: "POST", body });
