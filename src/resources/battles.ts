import type { ApiTransport } from "../transport";
import type { CreateBattleRequest, UpdateBattleRequest } from "../client";
import type {
	AchievementResponse,
	BattleResponse,
	BattlesResponse,
	PartiesResponse,
	StatusResponse,
} from "../types";

export const getBattles = (transport: ApiTransport): Promise<BattlesResponse> =>
	transport.request("battles", { method: "GET" });
export const createBattle = (
	transport: ApiTransport,
	body: CreateBattleRequest,
): Promise<BattleResponse> => transport.request("battles", { method: "POST", body });
export const getBattle = (transport: ApiTransport, id: string): Promise<BattleResponse> =>
	transport.request(`battles/${encodeURIComponent(id)}`, { method: "GET" });
export const updateBattle = (
	transport: ApiTransport,
	id: string,
	body: UpdateBattleRequest,
): Promise<StatusResponse> =>
	transport.request(`battles/${encodeURIComponent(id)}`, { method: "PATCH", body });
export const getParties = (transport: ApiTransport): Promise<PartiesResponse> =>
	transport.request("parties", { method: "GET" });
export const checkAchievement = (
	transport: ApiTransport,
	body: { event?: string },
): Promise<AchievementResponse> =>
	transport.request("achievements/check", { method: "POST", body });
