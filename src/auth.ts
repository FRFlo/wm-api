export const AUTH_COOKIE_NAMES = {
	part0: "sb-cyrxjeppjqsxxjayfrur-auth-token.0",
	part1: "sb-cyrxjeppjqsxxjayfrur-auth-token.1",
} as const;

export type AuthTokenParts = { part0: string; part1: string };
export type CookieValues = Partial<Record<string, string>>;

export function cookieHeader(values: CookieValues): string {
	return Object.entries(values)
		.filter(([, value]) => value !== undefined)
		.map(([name, value]) => `${name}=${value}`)
		.join("; ");
}
