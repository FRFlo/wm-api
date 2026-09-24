import { describe, expect, test } from "bun:test";
import { buildCollectionReport } from "../src/collection-report";

const entry = (id: string, title: string) => ({
	id: `owned-${id}`,
	card_id: id,
	count: 2,
	tags: [],
	starred: false,
	user_id: "user",
	is_shiny: false,
	obtained_at: new Date(),
	card: {
		id,
		wikipedia_title: title,
		wikipedia_url: new URL(`https://example.test/${id}`),
		image_url: null,
		category: "test",
		q_score: 1,
		rarity: "R",
		atk: 1,
		def: 1,
		pageviews: 1,
		lang: "fr",
		created_at: new Date(),
		hide_image: false,
	},
});

describe("buildCollectionReport", () => {
	test("keeps only cards above the one-wikibidou threshold", async () => {
		const client = {
			getMyCollection: async ({ page }: { page: number }) => ({
				collection: page === 1 ? [entry("a", "Carte A"), entry("b", "Carte B")] : [],
				total: 2,
			}),
			getCardSales: async (id: string) =>
				id === "a"
					? { wikipedia_title: "Carte A", summary: { all: { average: 3 } }, isPro: false }
					: { wikipedia_title: "Carte B", summary: {}, isPro: false },
		} as never;

		const report = await buildCollectionReport(client);
		expect(report.valuedCards.map((card) => card.cardId)).toEqual(["a"]);
		expect(report.withoutKnownValue.map((card) => card.cardId)).toEqual(["b"]);
	});
});
