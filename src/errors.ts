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

/** The server requires the user to complete its human-verification flow before opening a pack. */
export class HumanVerificationRequiredError extends WikiMastersApiError {
	constructor(status: number, details?: ApiRequestErrorDetails) {
		super("WikiMasters requires human verification before opening a pack", status, details);
		this.name = "HumanVerificationRequiredError";
	}
}
