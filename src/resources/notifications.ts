import type { ApiTransport } from "../transport";
import type { JsonValue } from "../json";
import type { NotificationUpdateResponse, NotificationsResponse } from "../types";

export const getNotifications = (transport: ApiTransport): Promise<NotificationsResponse> =>
	transport.request("notifications", { method: "GET" });
export const updateNotifications = (
	transport: ApiTransport,
	body: JsonValue = {},
): Promise<NotificationUpdateResponse> =>
	transport.request("notifications", { method: "PATCH", body });
