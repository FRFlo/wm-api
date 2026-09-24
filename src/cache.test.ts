import { describe, expect, test } from "bun:test";
import { type ApiCache, type ApiCacheStore } from "./cache";
import { WikiMastersClient } from "./client";

const memoryCacheStore = (): { store: ApiCacheStore; getCache: () => ApiCache | undefined } => {
	let cache: ApiCache | undefined;
	return {
		store: {
			load: async () => cache,
			save: async (next) => {
				cache = next;
			},
		},
		getCache: () => cache,
	};
};

describe("persistent response cache", () => {
	test("uses the resource TTL and refreshes an expired entry", async () => {
		const cache = memoryCacheStore();
		let requests = 0;
		const client = new WikiMastersClient({
			cacheStore: cache.store,
			fetch: async () => {
				requests++;
				return new Response(JSON.stringify({ notifications: [] }), {
					headers: { "content-type": "application/json" },
				});
			},
		});

		const before = Date.now();
		await client.getNotifications();
		await client.getNotifications();
		expect(requests).toBe(1);

		const entry = Object.values(cache.getCache()?.entries ?? {})[0];
		expect(entry?.expires_at.getTime()).toBeGreaterThan(before + 29_000);
		expect(entry?.expires_at.getTime()).toBeLessThan(before + 31_000);
		if (entry) entry.expires_at = new Date(0);

		await client.getNotifications();
		expect(requests).toBe(2);
	});

	test("clears cached reads after a successful mutation", async () => {
		const cache = memoryCacheStore();
		let notificationReads = 0;
		const client = new WikiMastersClient({
			cacheStore: cache.store,
			fetch: async (_request, init) => {
				if (init?.method === "PATCH")
					return new Response(JSON.stringify({ success: true }), {
						headers: { "content-type": "application/json" },
					});
				notificationReads++;
				return new Response(JSON.stringify({ notifications: [] }), {
					headers: { "content-type": "application/json" },
				});
			},
		});

		await client.getNotifications();
		await client.updateNotifications({ ids: ["notification-1"] });
		await client.getNotifications();
		expect(notificationReads).toBe(2);
	});

	test("reuses a custom persistent cache store across clients", async () => {
		const cache = memoryCacheStore();
		const first = new WikiMastersClient({
			cacheStore: cache.store,
			fetch: async () =>
				new Response(JSON.stringify({ balance: 10 }), {
					headers: { "content-type": "application/json" },
				}),
		});
		await first.getWikibidous();

		const second = new WikiMastersClient({
			cacheStore: cache.store,
			fetch: async () => {
				throw new Error("network should not be called for a cache hit");
			},
		});
		await expect(second.getWikibidous()).resolves.toEqual({ balance: 10 });
	});
});
