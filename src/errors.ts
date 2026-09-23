import type { JsonValue } from "./json";

export type ApiRequestErrorDetails = JsonValue | string | undefined;

export class WikiMastersApiError extends Error {
	readonly status: number;
	readonly details: ApiRequestErrorDetails;

	constructor(message: string, status: number, details?: ApiRequestErrorDetails) {
		super(message);
		this.name = "WikiMastersApiError";
		this.status = status;
		this.details = details;
	}
}
