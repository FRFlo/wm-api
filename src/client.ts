import { AUTH_COOKIE_NAMES, type AuthTokenParts, type CookieValues } from "./auth";
import { ApiTransport, type Fetcher, type QueryValue, type TransportOptions } from "./transport";
import * as auth from "./resources/auth";
import * as battles from "./resources/battles";
import * as cards from "./resources/cards";
import * as collection from "./resources/collection";
import * as economy from "./resources/economy";
import * as marketplace from "./resources/marketplace";
import * as notifications from "./resources/notifications";
import * as social from "./resources/social";
import * as trades from "./resources/trades";
import type { JsonValue } from "./json";

export type { AuthTokenParts, CookieValues } from "./auth";
export { AUTH_COOKIE_NAMES } from "./auth";
export { WikiMastersApiError } from "./errors";
export { normalizeApiValue } from "./normalize";
export type { Fetcher, QueryValue } from "./transport";
export type { JsonPrimitive, JsonValue } from "./json";

export type SecurityEvent = { eventType?: string; email?: string; success?: boolean };
export type TradeItem = { user_card_id?: string; card_id?: string; offered_by?: string };
export type CreateTradeRequest = {
	recipient_id?: string;
	items?: TradeItem[];
	initiator_wikibidous?: number;
	recipient_wikibidous?: number;
};
export type BidRequest = { amount?: number };
export type VerifyHumanRequest = { website?: string };
export type FriendActionRequest = { action?: string };
export type CreateBattleRequest = { opponent_id?: string };
export type AchievementCheckRequest = { event?: string };
export type UpdateBattleRequest = { action?: string; card_ids?: string[] };

export type RequestOptions = Omit<TransportOptions, "cookies"> & {
	cookies?: CookieValues;
	authTokenParts?: AuthTokenParts;
};

/** Public facade. Endpoint implementations live under `src/resources`. */
export class WikiMastersClient {
	private readonly transport: ApiTransport;

	constructor(options: RequestOptions = {}) {
		const cookies = {
			...(options.cookies ?? {}),
			...(options.authTokenParts
				? {
						[AUTH_COOKIE_NAMES.part0]: options.authTokenParts.part0,
						[AUTH_COOKIE_NAMES.part1]: options.authTokenParts.part1,
					}
				: {}),
		};
		this.transport = new ApiTransport({ ...options, cookies });
	}

	get baseUrl(): string {
		return this.transport.baseUrl;
	}
	setAuthTokenParts(parts: AuthTokenParts): void {
		this.transport.setCookies({
			[AUTH_COOKIE_NAMES.part0]: parts.part0,
			[AUTH_COOKIE_NAMES.part1]: parts.part1,
		});
	}
	setCookies(cookies: CookieValues): void {
		this.transport.setCookies(cookies);
	}
	request<T = JsonValue>(
		path: string,
		init: Omit<RequestInit, "body"> & { body?: JsonValue } = {},
		query?: Record<string, QueryValue>,
	): Promise<T> {
		return this.transport.request<T>(path, init, query);
	}

	logSecurityEvent(body: SecurityEvent) {
		return auth.logSecurityEvent(this.transport, body);
	}
	getNotifications() {
		return notifications.getNotifications(this.transport);
	}
	updateNotifications(body: JsonValue = {}) {
		return notifications.updateNotifications(this.transport, body);
	}
	verifyHuman(body: VerifyHumanRequest) {
		return economy.verifyHuman(this.transport, body);
	}
	openPack() {
		return economy.openPack(this.transport);
	}
	checkout() {
		return economy.checkout(this.transport);
	}
	getTrades(query?: { active?: number }) {
		return trades.getTrades(this.transport, query);
	}
	createTrade(body: CreateTradeRequest) {
		return trades.createTrade(this.transport, body);
	}
	getCollectionStats(query?: { sort?: string }) {
		return collection.getCollectionStats(this.transport, query);
	}
	getMyCollection(query?: { sort?: string; page?: number; stats?: number }) {
		return collection.getMyCollection(this.transport, query);
	}
	getMarketplaceItem(id: string) {
		return marketplace.getMarketplaceItem(this.transport, id);
	}
	getCardSales(id: string, query?: { scope?: string }) {
		return marketplace.getCardSales(this.transport, id, query);
	}
	getMyImageReports() {
		return collection.getMyImageReports(this.transport);
	}
	getFriends() {
		return social.getFriends(this.transport);
	}
	getWikibidous() {
		return economy.getWikibidous(this.transport);
	}
	getProfileCollection(
		id: string,
		query?: { page?: number; sort?: string; stats?: number; pending?: number },
	) {
		return collection.getProfileCollection(this.transport, id, query);
	}
	getMarketplace(query?: { page?: number; limit?: number; sort?: string; mine?: number }) {
		return marketplace.getMarketplace(this.transport, query);
	}
	bid(id: string, body: BidRequest) {
		return marketplace.bid(this.transport, id, body);
	}
	getShowcase() {
		return social.getShowcase(this.transport);
	}
	updateFriend(id: string, body: FriendActionRequest) {
		return social.updateFriend(this.transport, id, body);
	}
	getChat() {
		return social.getChat(this.transport);
	}
	getBattles() {
		return battles.getBattles(this.transport);
	}
	createBattle(body: CreateBattleRequest) {
		return battles.createBattle(this.transport, body);
	}
	getParties() {
		return battles.getParties(this.transport);
	}
	checkAchievement(body: AchievementCheckRequest) {
		return battles.checkAchievement(this.transport, body);
	}
	getCards(query?: { page?: number; sort?: string }) {
		return cards.getCards(this.transport, query);
	}
	getBattle(id: string) {
		return battles.getBattle(this.transport, id);
	}
	updateBattle(id: string, body: UpdateBattleRequest) {
		return battles.updateBattle(this.transport, id, body);
	}
}

export const createWikiMastersClient = (options: RequestOptions = {}) =>
	new WikiMastersClient(options);
