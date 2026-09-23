import type { ApiTransport } from "../transport";
import type {
	CollectionResponse,
	CollectionStatsResponse,
	ImageReportsResponse,
	ProfileCollectionResponse,
} from "../types";

export const getCollectionStats = (
	transport: ApiTransport,
	query?: { sort?: string },
): Promise<CollectionStatsResponse> =>
	transport.request("my-collection/stats", { method: "GET" }, query);
export const getMyCollection = (
	transport: ApiTransport,
	query?: { sort?: string; page?: number; stats?: number },
): Promise<CollectionResponse> => transport.request("my-collection", { method: "GET" }, query);
export const getMyImageReports = (transport: ApiTransport): Promise<ImageReportsResponse> =>
	transport.request("image-reports/mine", { method: "GET" });
export const getProfileCollection = (
	transport: ApiTransport,
	id: string,
	query?: { page?: number; sort?: string; stats?: number; pending?: number },
): Promise<ProfileCollectionResponse> =>
	transport.request(`profile/${encodeURIComponent(id)}/collection`, { method: "GET" }, query);
