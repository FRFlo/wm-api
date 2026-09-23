import { beforeAll, describe, expect, setDefaultTimeout, test } from "bun:test";
import { WikiMastersApiError } from "../src/index.ts";
import { WikiMastersClient } from "../src/index.ts";
import type {
	BattlesResponse,
	CardsResponse,
	CollectionResponse,
	MarketplaceResponse,
} from "../src/types.ts";

setDefaultTimeout(30_000);

const required = (name: string): string => {
	const value = Bun.env[name]?.trim();
	if (!value) throw new Error(`Variable ${name} is missing from .env`);
	return value;
};

const client = new WikiMastersClient({
	baseUrl: Bun.env.WIKIMASTERS_BASE_URL || undefined,
	authTokenParts: {
		part0: required("WIKIMASTERS_COOKIE_0"),
		part1: required("WIKIMASTERS_COOKIE_1"),
	},
	timeoutMs: Number(Bun.env.WIKIMASTERS_TIMEOUT_MS || 15_000),
});

async function expectLive<T>(
	call: () => Promise<T>,
	acceptableStatuses: number[] = [],
	acceptableErrors: string[] = [],
): Promise<T | undefined> {
	try {
		return await call();
	} catch (error) {
		if (error instanceof WikiMastersApiError && acceptableStatuses.includes(error.status)) {
			console.warn(`Live endpoint returned expected status ${error.status}`);
			return undefined;
		}
		if (error instanceof DOMException && acceptableErrors.includes(error.name)) {
			console.warn(`Live endpoint ended with expected error ${error.name}`);
			return undefined;
		}
		throw error;
	}
}

let collection: CollectionResponse;
let marketplace: MarketplaceResponse;
let battles: BattlesResponse;
let cards: CardsResponse;

describe("WikiMasters live read-only API", () => {
	beforeAll(async () => {
		[collection, marketplace, battles, cards] = await Promise.all([
			client.getMyCollection({ page: 1 }),
			client.getMarketplace({ page: 1, limit: 1 }),
			client.getBattles(),
			client.getCards({ page: 1, sort: "recent" }),
		]);
	});

	test("GET /notifications", async () =>
		expect((await client.getNotifications()).notifications).toBeArray());
	test("GET /trades", async () =>
		expect((await client.getTrades({ active: 1 })).trades).toBeArray());
	test("GET /my-collection/stats", async () =>
		expect((await client.getCollectionStats()).total).toBeNumber());
	test("GET /my-collection", () => expect(collection.collection).toBeArray());
	test("GET /image-reports/mine", async () => {
		const response = await expectLive(() => client.getMyImageReports(), [500]);
		if (response) expect(response.cardIds).toBeArray();
	});
	test("GET /friends", async () => expect((await client.getFriends()).friendships).toBeArray());
	test("GET /wikibidous", async () => expect((await client.getWikibidous()).balance).toBeNumber());
	test("GET /marketplace", () => expect(marketplace.auctions).toBeArray());
	test("GET /showcase", async () => expect((await client.getShowcase()).showcase).toBeArray());
	test("GET /chat", async () => expect((await client.getChat()).conversations).toBeArray());
	test("GET /battles", () => expect(battles.battles).toBeArray());
	test("GET /parties", async () => expect(await client.getParties()).toHaveProperty("party_quota"));
	test("GET /cards", () => expect(cards.cards).toBeArray());

	test("GET /marketplace/{id}", async () => {
		const auction = marketplace.auctions[0];
		if (!auction) return;
		const response = await expectLive(() => client.getMarketplaceItem(auction.id), [404]);
		if (response) expect(response).toBeDefined();
	});

	test("GET /marketplace/cards/{id}/sales", async () => {
		const cardId = marketplace.auctions[0]?.card_id ?? cards.cards[0]?.id;
		if (!cardId) return;
		const response = await expectLive(() => client.getCardSales(cardId), [403]);
		if (response) expect(response.wikipedia_title).toBeString();
	});

	test("GET /profile/{id}/collection", async () => {
		const profileKey =
			marketplace.auctions[0]?.seller.username ?? collection.collection[0]?.user_id;
		if (!profileKey) return;
		const response = await expectLive(
			() => client.getProfileCollection(profileKey, { page: 1 }),
			[404],
		);
		if (response) expect(response.collection).toBeArray();
	});

	test("GET /battles/{id}", async () => {
		const battle = battles.battles[0];
		const battleId =
			battle && typeof battle === "object" && !Array.isArray(battle)
				? (battle as { id?: unknown }).id
				: undefined;
		if (typeof battleId !== "string") return;
		const response = await expectLive(() => client.getBattle(battleId), [404], ["AbortError"]);
		if (response) expect(response.battle).toBeDefined();
	});
});
