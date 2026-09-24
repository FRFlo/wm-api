import { describe, expect, test } from "bun:test";
import { WikiMastersApiError } from "../src/errors";
import { RateLimiter, resilientRequest } from "../src/resilience";

describe("resilientRequest", () => {
	test("retries a rate-limited request and eventually succeeds", async () => {
		const limiter = new RateLimiter();
		let attempts = 0;
		const result = await resilientRequest(limiter, async () => {
			attempts += 1;
			if (attempts < 3) throw new WikiMastersApiError("rate limited", 429);
			return "ok";
		});

		expect(result).toBe("ok");
		expect(attempts).toBe(3);
	});

	test("does not retry permanent API errors", async () => {
		const limiter = new RateLimiter();
		let attempts = 0;
		await expect(
			resilientRequest(limiter, async () => {
				attempts += 1;
				throw new WikiMastersApiError("forbidden", 403);
			}),
		).rejects.toThrow("forbidden");
		expect(attempts).toBe(1);
	});
});

describe("RateLimiter", () => {
	test("allows bounded parallel requests", async () => {
		const limiter = new RateLimiter({ maxConcurrency: 2, minIntervalMs: 0 });
		let active = 0;
		let peak = 0;
		const operation = async () => {
			active += 1;
			peak = Math.max(peak, active);
			await new Promise((resolve) => setTimeout(resolve, 10));
			active -= 1;
		};

		await Promise.all([limiter.run(operation), limiter.run(operation), limiter.run(operation)]);
		expect(peak).toBe(2);
	});

	test("spaces sequential requests", async () => {
		const limiter = new RateLimiter();
		const timestamps: number[] = [];
		await Promise.all([
			limiter.run(async () => timestamps.push(Date.now())),
			limiter.run(async () => timestamps.push(Date.now())),
		]);

		expect(timestamps[1]! - timestamps[0]!).toBeGreaterThanOrEqual(240);
	});
});
