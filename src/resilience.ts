import { Effect, Schedule } from "effect";
import { WikiMastersApiError } from "./errors";

const MAX_RETRIES = 4;
const BASE_DELAY_MS = 500;
const MIN_INTERVAL_MS = 250;
const MAX_CONCURRENCY = 4;

type RateLimiterOptions = {
	maxConcurrency?: number;
	minIntervalMs?: number;
};

type PendingOperation<T> = {
	operation: () => Promise<T>;
	resolve: (value: T | PromiseLike<T>) => void;
	reject: (reason?: unknown) => void;
};

/** Bounds concurrent requests while spacing their start times globally. */
export class RateLimiter {
	private readonly maxConcurrency: number;
	private readonly minIntervalMs: number;
	private nextAvailableAt = 0;
	private active = 0;
	private pending: PendingOperation<unknown>[] = [];
	private drainTimer: ReturnType<typeof setTimeout> | undefined;

	constructor(options: RateLimiterOptions = {}) {
		this.maxConcurrency = Math.max(1, options.maxConcurrency ?? MAX_CONCURRENCY);
		this.minIntervalMs = Math.max(0, options.minIntervalMs ?? MIN_INTERVAL_MS);
	}

	run<T>(operation: () => Promise<T>): Promise<T> {
		return new Promise<T>((resolve, reject) => {
			this.pending.push({
				operation,
				resolve: resolve as (value: unknown) => void,
				reject,
			});
			this.drain();
		});
	}

	private drain(): void {
		while (this.active < this.maxConcurrency && this.pending.length > 0) {
			const waitMs = Math.max(0, this.nextAvailableAt - Date.now());
			if (waitMs > 0) {
				if (!this.drainTimer) {
					this.drainTimer = setTimeout(() => {
						this.drainTimer = undefined;
						this.drain();
					}, waitMs);
				}
				return;
			}

			const item = this.pending.shift()!;
			this.active += 1;
			this.nextAvailableAt = Date.now() + this.minIntervalMs;
			void item
				.operation()
				.then(item.resolve, item.reject)
				.finally(() => {
					this.active -= 1;
					this.drain();
				});
		}
	}
}

function isRetryable(error: unknown): boolean {
	if (error instanceof WikiMastersApiError) {
		return (
			error.status === 408 || error.status === 425 || error.status === 429 || error.status >= 500
		);
	}
	return error instanceof DOMException && error.name === "AbortError";
}

/** Runs a request with spacing plus exponential-jitter retry for transient failures. */
export function resilientRequest<T>(limiter: RateLimiter, operation: () => Promise<T>): Promise<T> {
	const effect = Effect.tryPromise({
		try: () => limiter.run(operation),
		catch: (error) => error,
	});
	return Effect.runPromise(
		Effect.retry(effect, {
			times: MAX_RETRIES,
			schedule: Schedule.exponential(`${BASE_DELAY_MS} millis`).pipe(Schedule.jittered),
			while: isRetryable,
		}),
	);
}
