const dateKeys = /(?:^|_)(?:at|date|until|created|updated|obtained|resets)$/i;
const urlKeys = /(?:^|_)url$/i;

/** Converts the API's ISO timestamps and URL fields into useful runtime values. */
export function normalizeApiValue(value: unknown, key?: string): unknown {
	if (typeof value === "string" && key && dateKeys.test(key)) {
		const date = new Date(value);
		if (!Number.isNaN(date.valueOf())) return date;
	}
	if (typeof value === "string" && key && urlKeys.test(key)) {
		try {
			return new URL(value);
		} catch {
			return value;
		}
	}
	if (Array.isArray(value)) return value.map((item) => normalizeApiValue(item));
	if (value && typeof value === "object" && !(value instanceof Date) && !(value instanceof URL)) {
		return Object.fromEntries(
			Object.entries(value).map(([childKey, child]) => [
				childKey,
				normalizeApiValue(child, childKey),
			]),
		);
	}
	return value;
}
