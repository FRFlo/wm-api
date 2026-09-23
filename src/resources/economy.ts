import type { ApiTransport } from "../transport";
import type {
	OpenPackResponse,
	CheckoutResponse,
	VerifyHumanResponse,
	WikibidousResponse,
} from "../types";
import type { VerifyHumanRequest } from "../client";

export const verifyHuman = (
	transport: ApiTransport,
	body: VerifyHumanRequest,
): Promise<VerifyHumanResponse> =>
	transport.request("packs/verify-human", { method: "POST", body });
export const openPack = (transport: ApiTransport): Promise<OpenPackResponse> =>
	transport.request("packs/open", { method: "POST" });
export const checkout = (transport: ApiTransport): Promise<CheckoutResponse> =>
	transport.request("checkout", { method: "POST" });
export const getWikibidous = (transport: ApiTransport): Promise<WikibidousResponse> =>
	transport.request("wikibidous", { method: "GET" });
