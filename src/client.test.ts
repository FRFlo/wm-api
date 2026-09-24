import { describe, expect, test } from "bun:test";
import {
	AUTH_COOKIE_NAMES,
	normalizeApiValue,
	WikiMastersClient,
} from "./client";

describe("WikiMastersClient", () => {
	test("covers an observed endpoint and serializes cookie authentication", async () => {
		let received: { url: string; headers: Headers } | undefined;
		const client = new WikiMastersClient({
			authTokenParts: { part0: "token-0", part1: "token-1" },
			cacheStore: { load: async () => undefined, save: async () => {} },
			fetch: async (request, init) => {
				received = {
					url: request instanceof Request ? request.url : String(request),
					headers: new Headers(init?.headers),
				};
				return new Response(JSON.stringify({ cards: [] }), {
					status: 200,
					headers: { "content-type": "application/json" },
				});
			},
		});

		const result = await client.getCards({ page: 2, sort: "recent" });
		const cardCount: number = result.cards.length;
		expect(cardCount).toBe(0);
		expect(received?.url).toBe("https://www.wiki-masters.com/api/cards?page=2&sort=recent");
		expect(received?.headers.get("origin")).toBe("https://www.wiki-masters.com");
		expect(received?.headers.get("referer")).toBe("https://www.wiki-masters.com/api/");
		expect(received?.headers.get("cookie")).toContain(`${AUTH_COOKIE_NAMES.part0}=token-0`);
		expect(received?.headers.get("cookie")).toContain(`${AUTH_COOKIE_NAMES.part1}=token-1`);
	});

	test("throws a structured error for API failures", async () => {
		const client = new WikiMastersClient({
			fetch: async () => new Response("nope", { status: 401 }),
		});
		await expect(client.getFriends()).rejects.toMatchObject({
			name: "WikiMastersApiError",
			status: 401,
			details: "nope",
		});
	});

	test("normalizes API timestamps and URL fields", () => {
		const value = normalizeApiValue({
			created_at: "2026-01-01T00:00:00.000Z",
			wikipedia_url: "https://example.com",
		}) as {
			created_at: Date;
			wikipedia_url: URL;
		};
		expect(value.created_at).toBeInstanceOf(Date);
		expect(value.wikipedia_url).toBeInstanceOf(URL);
	});

	test("implements captured marketplace listing operations", async () => {
		const requests: Array<{ url: string; method: string; body?: string }> = [];
		const client = new WikiMastersClient({
			fetch: async (request, init) => {
				requests.push({
					url: request instanceof Request ? request.url : String(request),
					method: init?.method ?? "GET",
					body: init?.body as string | undefined,
				});
				const response =
					init?.method === "POST" ? { auction_id: "auction-1" } : { status: "cancelled" };
				return new Response(JSON.stringify(response), {
					status: init?.method === "POST" ? 201 : 200,
					headers: { "content-type": "application/json" },
				});
			},
		});

		await expect(
			client.createMarketplaceListing({
				card_id: "card-1",
				base_amount: 60,
				duration_minutes: 60,
			}),
		).resolves.toEqual({ auction_id: "auction-1" });
		await expect(client.cancelMarketplaceListing("auction-1")).resolves.toEqual({
			status: "cancelled",
		});

		expect(requests).toEqual([
			{
				url: "https://www.wiki-masters.com/api/marketplace",
				method: "POST",
				body: '{"card_id":"card-1","base_amount":60,"duration_minutes":60}',
			},
			{
				url: "https://www.wiki-masters.com/api/marketplace/auction-1",
				method: "DELETE",
			},
		]);
	});

	test("verifies human status and retries opening the pack", async () => {
		const requests: string[] = [];
		let openAttempts = 0;
		const client = new WikiMastersClient({
			cacheStore: { load: async () => undefined, save: async () => {} },
			packStateStore: { load: async () => undefined, save: async () => {} },
			fetch: async (request) => {
				const path = new URL(request instanceof Request ? request.url : request).pathname;
				requests.push(path);

				if (path === "/api/packs/open" && openAttempts++ === 0) {
					return new Response(JSON.stringify({ human_verification_required: true }), {
						status: 403,
						headers: { "content-type": "application/json" },
					});
				}
				const response =
					path === "/api/packs/verify-human"
						? { pack_human_verified_at: "2026-09-24T10:00:00.000Z" }
						: {
							cards: [],
							packs_remaining: 2,
							packs_last_regen_at: "2026-09-24T10:01:00.000Z",
						};
				return new Response(JSON.stringify(response), {
					headers: { "content-type": "application/json" },
				});
			},
		});

		await expect(client.openPack()).resolves.toMatchObject({
			packs_remaining: 2,
		});
		expect(requests).toEqual([
			"/api/packs/open",
			"/api/packs/verify-human",
			"/api/packs/open",
		]);
	});
});
