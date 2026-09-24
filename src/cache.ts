import type { JsonValue } from "./json";
import { normalizeApiValue } from "./normalize";

export const DEFAULT_API_CACHE_PATH = ".wikimasters-api-cache.json";

export type ApiCacheEntry = {
	expires_at: Date;
	value: JsonValue;
};

export type ApiCache = { entries: Record<string, ApiCacheEntry> };

export interface ApiCacheStore {
	load(): Promise<ApiCache | undefined>;
	save(cache: ApiCache): Promise<void>;
}

/** Default Bun JSON-file store. Pass an ApiCacheStore to use another backend. */
export class JsonApiCacheStore implements ApiCacheStore {
	constructor(private readonly path = DEFAULT_API_CACHE_PATH) {}

	async load(): Promise<ApiCache | undefined> {
		const file = Bun.file(this.path);
		if (!(await file.exists())) return undefined;
		return normalizeApiValue(await file.json()) as ApiCache;
	}

	async save(cache: ApiCache): Promise<void> {
		await Bun.write(this.path, `${JSON.stringify(cache, null, 2)}\n`);
	}
}

export function cacheTtlMs(path: string): number {
	if (path === "notifications" || path === "wikibidous") return 30_000;
	if (
		path === "marketplace" ||
		path.startsWith("marketplace/") ||
		path === "trades" ||
		path === "showcase" ||
		path === "chat" ||
		path === "battles" ||
		path.startsWith("battles/") ||
		path === "parties"
	)
		return 60_000;
	return 300_000;
}
