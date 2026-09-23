import type { ApiTransport } from "../transport";
import type { CardsResponse } from "../types";

export const getCards = (
	transport: ApiTransport,
	query?: { page?: number; sort?: string },
): Promise<CardsResponse> => transport.request("cards", { method: "GET" }, query);
