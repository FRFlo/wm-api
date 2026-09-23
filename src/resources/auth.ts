import type { ApiTransport } from "../transport";
import type { SecurityEventResponse } from "../types";
import type { SecurityEvent } from "../client";

export function logSecurityEvent(
	transport: ApiTransport,
	body: SecurityEvent,
): Promise<SecurityEventResponse> {
	return transport.request("auth/log-security-event", { method: "POST", body });
}
