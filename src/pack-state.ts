import { normalizeApiValue } from "./normalize";

export const DEFAULT_PACK_STATE_PATH = ".wikimasters-pack-state.json";

export type PackProfileState = {
	pack_human_verified_at?: Date | null;
	packs_remaining?: number;
	packs_last_regen_at?: Date;
	activity_blocked_until?: Date | null;
	packs_blocked_until?: Date | null;
	is_pro?: boolean;
	updated_at: Date;
};

export interface PackStateStore {
	load(): Promise<PackProfileState | undefined>;
	save(state: PackProfileState): Promise<void>;
}

/** Default Bun JSON-file store. Pass a PackStateStore to use another backend. */
export class JsonPackStateStore implements PackStateStore {
	constructor(private readonly path = DEFAULT_PACK_STATE_PATH) {}

	async load(): Promise<PackProfileState | undefined> {
		const file = Bun.file(this.path);
		if (!(await file.exists())) return undefined;
		return normalizeApiValue(await file.json()) as PackProfileState;
	}

	async save(state: PackProfileState): Promise<void> {
		await Bun.write(this.path, `${JSON.stringify(state, null, 2)}\n`);
	}
}
