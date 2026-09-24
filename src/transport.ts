import { cookieHeader, type CookieValues } from "./auth";
import { cacheTtlMs, JsonApiCacheStore, type ApiCache, type ApiCacheStore } from "./cache";
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
	cachePath?: string;
	cacheStore?: ApiCacheStore;
};

export class ApiTransport {
	readonly baseUrl: string;
	private readonly fetcher: Fetcher;
	private readonly defaultHeaders: RequestInit["headers"];
	private readonly timeoutMs?: number;
	private readonly cacheStore: ApiCacheStore;
	private cookies: CookieValues;
	private cache?: ApiCache;
	private cacheLoaded = false;
	private cacheNamespace?: Promise<string>;

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
		this.cacheStore = options.cacheStore ?? new JsonApiCacheStore(options.cachePath);
	}

	setCookies(cookies: CookieValues): void {
		this.cookies = { ...this.cookies, ...cookies };
		this.cacheNamespace = undefined;
	}
	async clearCache(): Promise<void> {
		this.cache = { entries: {} };
		this.cacheLoaded = true;
		await this.cacheStore.save(this.cache);
	}
	private async getCache(): Promise<ApiCache> {
		if (!this.cacheLoaded) {
			const cache = (await this.cacheStore.load()) ?? { entries: {} };
			this.cache = cache;
			this.cacheLoaded = true;
			return cache;
		}
		return this.cache!;
	}
	private getCacheNamespace(): Promise<string> {
		this.cacheNamespace ??= (async () => {
			const credentials = Object.entries(this.cookies)
				.sort(([left], [right]) => left.localeCompare(right))
				.map(([name, value]) => `${name}=${value}`)
				.join(";");
			if (!credentials) return "anonymous";
			const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(credentials));
			return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join(
				"",
			);
		})();
		return this.cacheNamespace;
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
		const method = init.method?.toUpperCase() ?? "GET";
		const cacheKey =
			method === "GET" ? `${await this.getCacheNamespace()}:${url.toString()}` : undefined;
		if (cacheKey) {
			const entry = (await this.getCache()).entries[cacheKey];
			if (entry && entry.expires_at.getTime() > Date.now()) return entry.value as T;
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
			const value = normalizeApiValue(details) as JsonValue;
			if (cacheKey) {
				const cache = await this.getCache();
				cache.entries[cacheKey] = {
					expires_at: new Date(Date.now() + cacheTtlMs(path)),
					value,
				};
				await this.cacheStore.save(cache);
			} else await this.clearCache();
			return value as T;
		} finally {
			if (timeout !== undefined) clearTimeout(timeout);
		}
	}
}
