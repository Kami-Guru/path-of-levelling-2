import Store from "electron-store";
import { Build, BuildStore, DeepValue, GameSettings, GlobalSettings, NestedKeys, ProfileId } from "../zodSchemas/schemas.js";
import log from "electron-log";

// StoreService is used to interface with the various electron stores the app uses.
// Includes wrappers to add type safety to get and set calls, as well as abstractions to
// hide which game is currently being accessed.
export class StoreService {
    private globalSettingsStore: Store<GlobalSettings>;

    //@ts-ignore - ignore ts(2564) these are set in switchProfile in the ctor
    private gameSettingsStore: Store<GameSettings>;
    //@ts-ignore - ignore ts(2564) these are set in switchProfile in the ctor
    private buildsStore: Store<BuildStore>;

    constructor() {
        this.globalSettingsStore = new Store<GlobalSettings>({
            name: "globalSettings"
        });

        // StoreService is required for migration/validation/fixing all stores, so here we need to
        // default to a profile if the local storage is empty or invalid.
        this.switchProfile(this.getSelectedProfileId() ?? "poe2");

        log.info("StoreService constructed");
    }

    init() {
        log.info("StoreService initialised");
    }

    getSelectedProfileId(): ProfileId {
        return this.getGlobalSetting("selectedProfile");
    }

    switchProfile(profileId: ProfileId) {
        this.setGlobalSetting("selectedProfile", profileId);

        this.gameSettingsStore = this.getGameSettingsStoreForProfileId(profileId);
        this.buildsStore = this.getBuildsStoreForProfileId(profileId)
    }

    private getGameSettingsStoreForProfileId(profileId: ProfileId): Store<GameSettings> {
        return new Store<GameSettings>({
            name: `${profileId}-gameSettings`
        });
    }

    private getBuildsStoreForProfileId(profileId: ProfileId): Store<BuildStore> {
        return new Store<BuildStore>({
            name: `${profileId}-builds`
        });
    }

    // --- Typed getter/setters wrappers for stores --- //

    getAllGlobalSettings(): GlobalSettings {
        return this.globalSettingsStore.store;
    }
    
    setAllGlobalSettings(settings: GlobalSettings): void {
        this.globalSettingsStore.store = settings
    }

    getGlobalSetting<K extends NestedKeys<GlobalSettings>>(key: K): DeepValue<GlobalSettings, K> {
        return this.globalSettingsStore.get(key) as DeepValue<GlobalSettings, K>
    }

    setGlobalSetting<K extends NestedKeys<GlobalSettings>>
        (key: K, value: DeepValue<GlobalSettings, K>): void {
        this.globalSettingsStore.set(key, value);
    }

    getAllGameSettings(): GameSettings {
        if (!this.gameSettingsStore) throw new Error("Profile not initialized");
        return this.gameSettingsStore.store;
    }

    setAllGameSettings(settings: GameSettings): void {
        if (!this.gameSettingsStore) throw new Error("Profile not initialized");
        this.gameSettingsStore.store = settings;
    }

    getGameSetting<K extends NestedKeys<GameSettings>>(key: K): DeepValue<GameSettings, K> {
        if (!this.gameSettingsStore) throw new Error("Profile not initialized");
        return this.gameSettingsStore.get(key) as DeepValue<GameSettings, K>
    }

    setGameSetting<K extends NestedKeys<GameSettings>>(key: K, value: DeepValue<GameSettings, K>)
        : void {
        if (!this.gameSettingsStore) throw new Error("Profile not initialized");
        this.gameSettingsStore.set(key, value);
    }

    getAllBuildNames(): string[] {
        if (!this.buildsStore) throw new Error("Profile not initialized");
        return Object.keys(this.buildsStore.get("builds"));
    }

    // Can't have the same type safety accessing the Builds store since builds are stored
    // in a dictionary, and we can't know the keys of that dictionary at compile time.
    getBuild(buildName: string): Build | undefined {
        if (!this.buildsStore) throw new Error("Profile not initialized");

        const allBuilds = this.buildsStore.get("builds") as BuildStore["builds"];
        return allBuilds[buildName];
    }

    setBuild(buildName: string, build: Build): void {
        if (!this.buildsStore) throw new Error("Profile not initialized");

        const allBuilds = this.buildsStore.get("builds") as BuildStore["builds"];
        allBuilds[buildName] = build; // Upsert the build to the dict
        this.buildsStore.set("builds", allBuilds);
    }

    deleteBuild(buildName: string): void {
        if (!this.buildsStore) throw new Error("Profile not initialized");

        const allBuilds = this.buildsStore.get("builds") as BuildStore["builds"];
        delete allBuilds[buildName]; // Delete the build from the dict
        this.buildsStore.set("builds", allBuilds);
    }

    // --- Allow callers to access specific stores without having to switch profile --- //

    getAllGameSettingsForProfileId(profileId: ProfileId): GameSettings {
        return this.getGameSettingsStoreForProfileId(profileId).store;
    }

    setAllGameSettingsForProfileId(profileId: ProfileId, settings: GameSettings): void {
        this.getGameSettingsStoreForProfileId(profileId).store = settings;
    }

    getGameSettingForProfileId<K extends NestedKeys<GameSettings>>(profileId: ProfileId, key: K)
        : DeepValue<GameSettings, K> {
        return this.getGameSettingsStoreForProfileId(profileId).get(key) as DeepValue<GameSettings, K>
    }

    setGameSettingForProfileId<K extends NestedKeys<GameSettings>>
        (profileId: ProfileId, key: K, value: DeepValue<GameSettings, K>): void {
        this.getGameSettingsStoreForProfileId(profileId).set(key, value);
    }

    /** WARNING - you probably don't want this method! It has very limited use cases! */
    getBuildForProfileId(profileId: ProfileId, buildName: string): Build | undefined {
        const buildsStore = this.getBuildsStoreForProfileId(profileId);
        const allBuilds = buildsStore.get("builds") as BuildStore["builds"];
        return allBuilds === undefined ? undefined : allBuilds[buildName];
    }

    /** WARNING - you probably don't want this method! It has very limited use cases! */
    setBuildForProfileId(profileId: ProfileId, buildName: string, build: Build): void {
        const buildsStore = this.getBuildsStoreForProfileId(profileId);
        const allBuilds = buildsStore.get("builds") as BuildStore["builds"] ?? {};
        allBuilds[buildName] = build; // Upsert the build to the dict
        buildsStore.set("builds", allBuilds);
    }
}