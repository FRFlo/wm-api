import type { ApiTransport } from "../transport";
import type { FriendActionRequest } from "../client";
import type { ChatResponse, FriendsResponse, ShowcaseResponse, StatusResponse } from "../types";

export const getFriends = (transport: ApiTransport): Promise<FriendsResponse> =>
	transport.request("friends", { method: "GET" });
export const updateFriend = (
	transport: ApiTransport,
	id: string,
	body: FriendActionRequest,
): Promise<StatusResponse> =>
	transport.request(`friends/${encodeURIComponent(id)}`, { method: "PATCH", body });
export const getShowcase = (transport: ApiTransport): Promise<ShowcaseResponse> =>
	transport.request("showcase", { method: "GET" });
export const getChat = (transport: ApiTransport): Promise<ChatResponse> =>
	transport.request("chat", { method: "GET" });
