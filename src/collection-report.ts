import { mkdir } from "node:fs/promises";
import { WikiMastersClient } from "./client";
import type { CardSalesResponse, CollectionEntry } from "./types";
import { RateLimiter, resilientRequest } from "./resilience";

const MIN_VALUE = 1;
const OUTPUT_DIR = "reports";

type ReportCard = {
	cardId: string;
	title: string;
	rarity: string;
	quantity: number;
	averageValue: number;
	valueSource: string;
	canList: boolean;
	url: string;
	status: "valued" | "no-known-value" | "error";
	error?: string;
};

type CollectionReport = {
	generatedAt: string;
	minimumValue: number;
	collectionSize: number;
	valuedCards: ReportCard[];
	withoutKnownValue: ReportCard[];
	errors: ReportCard[];
};

function required(name: string): string {
	const value = Bun.env[name]?.trim();
	if (!value) throw new Error(`Variable ${name} is missing from .env`);
	return value;
}

async function getCollection(
	client: WikiMastersClient,
	limiter: RateLimiter,
): Promise<CollectionEntry[]> {
	const result: CollectionEntry[] = [];
	for (let page = 1; ; page += 1) {
		const response = await resilientRequest(limiter, () => client.getMyCollection({ page }));
		result.push(...response.collection);
		if (
			response.collection.length === 0 ||
			(response.total !== null && result.length >= response.total)
		) {
			return result;
		}
		// The API may use a server-side page size that differs between environments.
		if (page > 10_000) throw new Error("Collection pagination exceeded the safety limit");
	}
}

function averageSalesValue(sales: CardSalesResponse): { value: number; source: string } | null {
	const entries = Object.entries(sales.summary ?? {})
		.map(([source, data]) => ({ source, value: Number(data.average) }))
		.filter(({ value }) => Number.isFinite(value) && value > 0);
	if (!entries.length) return null;
	const value = entries.reduce((sum, entry) => sum + entry.value, 0) / entries.length;
	return { value, source: entries.map((entry) => entry.source).join(", ") };
}

function markdown(report: CollectionReport): string {
	const lines = [
		"# Rapport de valorisation de la collection",
		"",
		`Généré le : ${report.generatedAt}`,
		`Seuil de mise en vente : **${report.minimumValue} wikibidou(s)**`,
		`Cartes analysées : **${report.collectionSize}**`,
		`Cartes vendables : **${report.valuedCards.length}**`,
		"",
		"## Cartes vendables",
		"",
		"| Carte | Rareté | Quantité | Valeur moyenne | Source |",
		"| --- | --- | ---: | ---: | --- |",
	];
	for (const card of report.valuedCards) {
		lines.push(
			`| [${card.title}](${card.url}) | ${card.rarity} | ${card.quantity} | ${card.averageValue.toFixed(2)} | ${card.valueSource} |`,
		);
	}
	lines.push(
		"",
		"## Cartes sans valeur connue",
		"",
		"Ces cartes sont conservées dans le JSON pour décision manuelle.",
		"",
	);
	for (const card of report.withoutKnownValue) {
		lines.push(`- ${card.title} (${card.cardId})`);
	}
	if (report.errors.length) {
		lines.push("", "## Erreurs de consultation", "");
		for (const card of report.errors) {
			lines.push(`- ${card.title} (${card.cardId}) : ${card.error}`);
		}
	}
	return `${lines.join("\n")}\n`;
}

export async function buildCollectionReport(client: WikiMastersClient): Promise<CollectionReport> {
	const limiter = new RateLimiter({ maxConcurrency: 4 });
	const collection = await getCollection(client, limiter);
	const all = await Promise.all(
		collection.map(async (entry): Promise<ReportCard> => {
			try {
				const sales = await resilientRequest(limiter, () => client.getCardSales(entry.card_id));
				const average = averageSalesValue(sales);
				const card: ReportCard = {
					cardId: entry.card_id,
					title: entry.card.wikipedia_title,
					rarity: entry.card.rarity,
					quantity: entry.count,
					averageValue: average?.value ?? 0,
					valueSource: average?.source ?? "aucune vente connue",
					canList: Boolean(average && average.value >= MIN_VALUE),
					url: String(entry.card.wikipedia_url),
					status: average && average.value >= MIN_VALUE ? "valued" : "no-known-value",
				};
				return card;
			} catch (error) {
				return {
					cardId: entry.card_id,
					title: entry.card.wikipedia_title,
					rarity: entry.card.rarity,
					quantity: entry.count,
					averageValue: 0,
					valueSource: "échec de consultation",
					canList: false,
					url: String(entry.card.wikipedia_url),
					status: "error",
					error: error instanceof Error ? error.message : String(error),
				};
			}
		}),
	);
	return {
		generatedAt: new Date().toISOString(),
		minimumValue: MIN_VALUE,
		collectionSize: collection.length,
		valuedCards: all.filter((card) => card.status === "valued"),
		withoutKnownValue: all.filter((card) => card.status === "no-known-value"),
		errors: all.filter((card) => card.status === "error"),
	};
}

async function main(): Promise<void> {
	const client = new WikiMastersClient({
		baseUrl: Bun.env.WIKIMASTERS_BASE_URL || undefined,
		timeoutMs: Number(Bun.env.WIKIMASTERS_TIMEOUT_MS || 15_000),
		authTokenParts: {
			part0: required("WIKIMASTERS_COOKIE_0"),
			part1: required("WIKIMASTERS_COOKIE_1"),
		},
	});
	const report = await buildCollectionReport(client);
	await mkdir(OUTPUT_DIR, { recursive: true });
	await Bun.write(`${OUTPUT_DIR}/collection-report.json`, `${JSON.stringify(report, null, 2)}\n`);
	await Bun.write(`${OUTPUT_DIR}/collection-report.md`, markdown(report));
	console.log(
		`Rapport terminé : ${report.valuedCards.length} carte(s) vendable(s) sur ${report.collectionSize}.`,
	);
}

if (import.meta.main) await main();
