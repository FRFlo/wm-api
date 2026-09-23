import { describe, expect, test } from "bun:test";
import { AUTH_COOKIE_NAMES, normalizeApiValue, WikiMastersClient } from "./client";

describe("WikiMastersClient", () => {
	test("covers an observed endpoint and serializes cookie authentication", async () => {
		let received: { url: string; headers: Headers } | undefined;
		const client = new WikiMastersClient({
			authTokenParts: { part0: "token-0", part1: "token-1" },
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
});
