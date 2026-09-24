import type { ApiTransport } from "../transport";
import type { BidRequest, CreateMarketplaceListingRequest } from "../client";
import type {
	BidResponse,
	CardSalesResponse,
	CreateMarketplaceListingResponse,
	MarketplaceAuctionResponse,
	MarketplaceLimitResponse,
	MarketplaceResponse,
	StatusResponse,
} from "../types";

export const getMarketplaceItem = (
	transport: ApiTransport,
	id: string,
): Promise<MarketplaceAuctionResponse> =>
	transport.request(`marketplace/${encodeURIComponent(id)}`, { method: "GET" });
export const getMarketplaceLimits = (transport: ApiTransport): Promise<MarketplaceLimitResponse> =>
	transport.request("marketplace/mine", { method: "GET" });
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
export const createMarketplaceListing = (
	transport: ApiTransport,
	body: CreateMarketplaceListingRequest,
): Promise<CreateMarketplaceListingResponse> =>
	transport.request("marketplace", { method: "POST", body });
export const cancelMarketplaceListing = (
	transport: ApiTransport,
	id: string,
): Promise<StatusResponse> =>
	transport.request(`marketplace/${encodeURIComponent(id)}`, { method: "DELETE" });
export const bid = (transport: ApiTransport, id: string, body: BidRequest): Promise<BidResponse> =>
	transport.request(`marketplace/${encodeURIComponent(id)}/bid`, { method: "POST", body });
