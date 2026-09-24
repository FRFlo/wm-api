import { afterEach, describe, expect, test } from "bun:test";
import { rm } from "node:fs/promises";
import { WikiMastersClient } from "./client";
import { JsonPackStateStore, type PackProfileState, type PackStateStore } from "./pack-state";

const temporaryFiles: string[] = [];

afterEach(async () => {
	await Promise.all(temporaryFiles.splice(0).map((path) => rm(path, { force: true })));
});

describe("pack profile persistence", () => {
	test("loads and saves the default JSON store format", async () => {
		const path = `pack-state-${crypto.randomUUID()}.json`;
		temporaryFiles.push(path);
		const store = new JsonPackStateStore(path);
		const state: PackProfileState = {
			pack_human_verified_at: new Date("2026-09-24T10:00:00.000Z"),
			packs_remaining: 4,
			is_pro: false,
			updated_at: new Date("2026-09-24T10:00:00.000Z"),
		};

		await store.save(state);
		await expect(store.load()).resolves.toEqual(state);
	});

	test("persists pack updates through a custom store", async () => {
		const saved: PackProfileState[] = [];
		const store: PackStateStore = {
			load: async () => ({ is_pro: true, updated_at: new Date("2026-09-24T09:00:00.000Z") }),
			save: async (state) => void saved.push(state),
		};
		const client = new WikiMastersClient({
			packStateStore: store,
			fetch: async (request) => {
				const path = new URL(request instanceof Request ? request.url : request).pathname;
				const response =
					path === "/api/packs/verify-human"
						? { pack_human_verified_at: "2026-09-24T10:00:00.000Z" }
						: {
								cards: [],
								packs_remaining: 4,
								packs_last_regen_at: "2026-09-24T10:01:00.000Z",
							};
				return new Response(JSON.stringify(response), {
					headers: { "content-type": "application/json" },
				});
			},
		});

		await client.verifyHuman({ website: "" });
		await client.openPack();

		expect(saved).toHaveLength(2);
		expect(saved[1]).toMatchObject({
			is_pro: true,
			packs_remaining: 4,
			pack_human_verified_at: new Date("2026-09-24T10:00:00.000Z"),
			packs_last_regen_at: new Date("2026-09-24T10:01:00.000Z"),
		});
	});
});
