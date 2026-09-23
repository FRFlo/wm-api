import type { ApiTransport } from "../transport";
import type { BidRequest } from "../client";
import type {
	BidResponse,
	CardSalesResponse,
	MarketplaceLimitResponse,
	MarketplaceResponse,
} from "../types";

export const getMarketplaceItem = (
	transport: ApiTransport,
	id: string,
): Promise<MarketplaceLimitResponse> =>
	transport.request(`marketplace/${encodeURIComponent(id)}`, { method: "GET" });
export const getCardSales = (
	transport: ApiTransport,
	id: string,
	query?: { scope?: string },
): Promise<CardSalesResponse> =>
	transport.request(`marketplace/cards/${encodeURIComponent(id)}/sales`, { method: "GET" }, query);
export const getMarketplace = (
	transport: ApiTransport,
	query?: { page?: number; limit?: number; sort?: string; mine?: number },
): Promise<MarketplaceResponse> => transport.request("marketplace", { method: "GET" }, query);
export const bid = (transport: ApiTransport, id: string, body: BidRequest): Promise<BidResponse> =>
	transport.request(`marketplace/${encodeURIComponent(id)}/bid`, { method: "POST", body });
