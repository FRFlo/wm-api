import { cookieHeader, type CookieValues } from "./auth";
import { WikiMastersApiError, type ApiRequestErrorDetails } from "./errors";
import { normalizeApiValue } from "./normalize";
import type { JsonValue } from "./json";

export type QueryValue = string | number | boolean | undefined | null;
export type Fetcher = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

export type TransportOptions = {
	baseUrl?: string;
	cookies?: CookieValues;
	headers?: RequestInit["headers"];
	fetch?: Fetcher;
	timeoutMs?: number;
};

export class ApiTransport {
	readonly baseUrl: string;
	private readonly fetcher: Fetcher;
	private readonly defaultHeaders: RequestInit["headers"];
	private readonly timeoutMs?: number;
	private cookies: CookieValues;

	constructor(options: TransportOptions = {}) {
		this.baseUrl = (options.baseUrl ?? "https://www.wiki-masters.com/api").replace(/\/$/, "");
		this.fetcher = options.fetch ?? globalThis.fetch;
		const baseUrl = new URL(this.baseUrl);
		const defaultHeaders = new Headers(options.headers);
		defaultHeaders.set("origin", baseUrl.origin);
		defaultHeaders.set("referer", `${this.baseUrl}/`);
		this.defaultHeaders = defaultHeaders;
		this.timeoutMs = options.timeoutMs;
		this.cookies = { ...(options.cookies ?? {}) };
	}

	setCookies(cookies: CookieValues): void {
		this.cookies = { ...this.cookies, ...cookies };
	}

	async request<T = JsonValue>(
		path: string,
		init: Omit<RequestInit, "body"> & { body?: JsonValue } = {},
		query?: Record<string, QueryValue>,
	): Promise<T> {
		const url = new URL(`${this.baseUrl}/${path.replace(/^\//, "")}`);
		if (query)
			for (const [key, value] of Object.entries(query)) {
				if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
			}

		const headers = new Headers(this.defaultHeaders);
		for (const [key, value] of new Headers(init.headers)) headers.set(key, value);
		const cookies = cookieHeader(this.cookies);
		if (cookies) headers.set("cookie", cookies);

		let body: string | undefined;
		if (init.body !== undefined) {
			headers.set("content-type", "application/json");
			body = JSON.stringify(init.body);
		}

		const controller = new AbortController();
		const timeout =
			this.timeoutMs === undefined
				? undefined
				: setTimeout(() => controller.abort(), this.timeoutMs);
		try {
			const response = await this.fetcher(url, {
				...init,
				headers,
				body,
				signal: init.signal ?? controller.signal,
			});
			const contentType = response.headers.get("content-type") ?? "";
			const details = contentType.includes("json") ? await response.json() : await response.text();
			if (!response.ok)
				throw new WikiMastersApiError(
					`WikiMasters API returned ${response.status}`,
					response.status,
					details as ApiRequestErrorDetails,
				);
			return normalizeApiValue(details) as T;
		} finally {
			if (timeout !== undefined) clearTimeout(timeout);
		}
	}
}
