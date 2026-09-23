import type { JsonValue } from "./json";

export type Nullable<T> = T | null;

export type Rarity = "C" | "L" | "R" | "PC" | "SR" | "UR" | string;

export type RarityCounts = Partial<Record<"C" | "L" | "R" | "PC" | "SR" | "UR", number>> &
	Record<string, number>;

export type Card = {
	id: string;
	wikipedia_title: string;
	wikipedia_url: URL;
	summary?: string;
	image_url: Nullable<URL>;
	category: string;
	q_score: number | string;
	rarity: Rarity;
	atk: number;
	def: number;
	pageviews: number;
	content_length?: number;
	lang: string;
	created_at: Date;
	hide_image: boolean;
	rarity_order?: number;
	in_global_collection?: boolean;
	pageviews_refreshed_at?: Date;
	qscore_refreshed_at?: Date;
	info_refreshed_at?: Date;
	search_document?: string;
	nsfw_image?: boolean;
	nsfw_reviewed_at?: Nullable<Date>;
};

export type Notification = {
	id: string;
	user_id: string;
	type: string;
	data: {
		title?: string;
		card_id?: string;
		message?: string;
		auction_id?: string;
		card_title?: string;
	};
	read: boolean;
	created_at: Date;
};

export type CollectionEntry = {
	id: string;
	card: Pick<
		Card,
		| "id"
		| "atk"
		| "def"
		| "lang"
		| "rarity"
		| "q_score"
		| "category"
		| "image_url"
		| "pageviews"
		| "created_at"
		| "hide_image"
		| "wikipedia_url"
		| "wikipedia_title"
	>;
	tags: JsonValue[];
	count: number;
	card_id: string;
	starred: boolean;
	user_id: string;
	is_shiny: boolean;
	obtained_at: Date;
	owned_by_viewer?: boolean;
};

export type UserSummary = {
	id: string;
	username: string;
	avatar_url: Nullable<URL>;
	avatar_pos_x: number;
	avatar_pos_y: number;
	activity_blocked_until?: Nullable<Date>;
};

export type Auction = {
	id: string;
	seller_id: string;
	card_id: string;
	base_amount: number;
	current_bid: Nullable<number>;
	current_bidder_id: Nullable<string>;
	end_at: Date;
	status: string;
	winner_id: Nullable<string>;
	final_price: Nullable<number>;
	created_at: Date;
	settled_at: Nullable<Date>;
	snapshot_rarity: Rarity;
	snapshot_atk: number;
	snapshot_def: number;
	effective_bid: number;
	listing_base_amount: number;
	base_repriced_at: Nullable<Date>;
	is_shiny: boolean;
	snapshot_search_document: Nullable<string>;
	seller: UserSummary;
	current_bidder: Nullable<UserSummary>;
	winner: Nullable<UserSummary>;
	card: Card;
	owned: boolean;
};

export type Quota = { used: number; limit: number; resets_at: Date };

export type NotificationsResponse = { notifications: Notification[] };
export type NotificationUpdateResponse = { success?: boolean };
export type SecurityEventResponse = { ok?: boolean };
export type VerifyHumanResponse = { pack_human_verified_at?: Date };
export type OpenPackResponse = {
	cards: Card[];
	packs_remaining: number;
	packs_last_regen_at: Date;
};
export type CheckoutResponse = { url: URL };
export type TradesResponse = { trades: JsonValue[] };
export type TradeResponse = {
	trade: {
		id: string;
		initiator_id: string;
		recipient_id: string;
		status: string;
		parent_trade_id: Nullable<string>;
		created_at: Date;
		updated_at: Date;
		initiator_wikibidous: number;
		recipient_wikibidous: number;
	};
};
export type CollectionStatsResponse = {
	total: number;
	rarityCounts: RarityCounts;
	tagOptions: JsonValue[];
};
export type CollectionResponse = {
	collection: CollectionEntry[];
	total: Nullable<number>;
	rarityCounts: RarityCounts;
	tagOptions: JsonValue[];
	pendingTradeCardIds: string[];
};
export type MarketplaceLimitResponse = { sellingCount?: number; maxConcurrentAuctions?: number };
export type CardSalesResponse = {
	wikipedia_title: string;
	summary: Record<string, { average: number }>;
	isPro: boolean;
};
export type ImageReportsResponse = { cardIds: string[] };
export type Friendship = {
	id: string;
	requester_id: string;
	addressee_id: string;
	status: string;
	created_at: Date;
	updated_at: Date;
	requester: UserSummary;
	addressee: UserSummary;
};
export type FriendsResponse = {
	friendships: Friendship[];
	counts: { accepted: number; incoming: number; outgoing: number };
};
export type WikibidousResponse = { balance: number };
export type ProfileCollectionResponse = {
	collection: CollectionEntry[];
	total: number;
	rarityCounts: RarityCounts;
	tagOptions: Array<{
		id: string;
		name: string;
		color: string;
		user_id: string;
		cardCount: number;
		created_at: Date;
	}>;
	profileId: string;
	pendingTradeCardIds: string[];
};
export type MarketplaceResponse = {
	auctions: Auction[];
	page: number;
	limit: number;
	total: number;
	hasMore: boolean;
	selling?: Auction[];
	bidding?: Auction[];
	history?: Auction[];
	won?: Auction[];
	maxConcurrentAuctions?: number;
	mine?: boolean;
};
export type BidResponse = { auction_id: string; current_bid: number; bidder_balance: number };
export type ShowcaseResponse = { showcase: JsonValue[]; galleries: JsonValue[] };
export type ChatResponse = { conversations: JsonValue[] };
export type BattlesResponse = { battles: JsonValue[]; challenge_quota: Quota };
export type BattleResponse = {
	battle: JsonValue;
	decks: JsonValue[];
	quizPayloads: JsonValue[];
	shinyCardIds: Record<string, string>;
};
export type PartiesResponse = { party_quota: Quota };
export type AchievementResponse = { unlocked: string[] };
export type CardsResponse = {
	cards: Card[];
	total: number;
	searchHasMore: boolean;
	rarityCounts: RarityCounts;
	friendOwners: Record<string, JsonValue>;
	ownedCardIds: string[];
	wishlistCardIds: string[];
	friendPendingOfferKeys: string[];
};
export type StatusResponse = { status: string };
