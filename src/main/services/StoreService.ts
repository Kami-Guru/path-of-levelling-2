import Store from "electron-store";
import path from 'path';
import { z } from 'zod';
import { app } from 'electron';
import { GameProfile, getProfile } from "../profiles/profiles.js";
import { BuildStore as Builds, GameSettings, GlobalSettings } from "../zodSchemas/schemas.js"
import { Build } from "../trackers/GemTracker.js";

// StoreService is used to interface with the various electron stores the app uses.
// Includes wrappers to add type safety to get and set calls, as well as abstractions to
// hide which game is currently being accessed.
export class StoreService {
    globalSettingsStore: Store<GlobalSettings>;

    // These are only undefined after constructor, we should immediately call switchProfile
    // to load these stores.
    gameSettingsStore: Store<GameSettings> | undefined;
    buildsStore: Store<Builds> | undefined;

    constructor() {
        this.globalSettingsStore = new Store<GlobalSettings>({
            name: "globalSettings"
        });
    }

    getSelectedProfileId(): "poe1" | "poe2" {
        return this.getGlobalSetting("selectedProfile");
    }

    switchProfile(profileId: "poe1" | "poe2") {
        this.setGlobalSetting("selectedProfile", profileId);

        this.gameSettingsStore = this.getGameSettingsStoreForProfileId(profileId);
        this.buildsStore = this.getBuildsStoreForProfileId(profileId)
    }

    // Stores are prefixed with the profile they are for; eg poe1-settings.json or poe2-builds.json
    private getGameSettingsStoreForProfileId(profileId: "poe1" | "poe2"): Store<GameSettings> {
        return new Store<GameSettings>({
            name: `${profileId}-gameSettings`
        });
    }

    private getBuildsStoreForProfileId(profileId: "poe1" | "poe2") : Store<Builds> {
        return new Store<Builds>({
            name: `${profileId}-builds`
        });
    }

    getGlobalSetting<K extends keyof GlobalSettings>(key: K): GlobalSettings[K] {
        return this.globalSettingsStore.get(key) as GlobalSettings[K]
    }

    setGlobalSetting<K extends keyof GlobalSettings>(key: K, value: GlobalSettings[K]) : void {
        this.globalSettingsStore.set(key, value);
    }

    getGameSetting<K extends keyof GameSettings>(key: K) : GameSettings[K] {
        if (!this.gameSettingsStore) throw new Error("Profile not initialized");
        return this.gameSettingsStore.get(key) as GameSettings[K]
    }

    setGameSetting<K extends keyof GameSettings>(key: K, value: GameSettings[K]) : void {
        if (!this.gameSettingsStore) throw new Error("Profile not initialized");
        this.gameSettingsStore.set(key, value);
    }

    getAllBuildNames(): string[] {
        if (!this.buildsStore) throw new Error("Profile not initialized");
        return Object.keys(this.buildsStore.get("builds"));
    }

    // Can't have the same type safety accessing the Builds store since builds are stored
    // in a dicitonary, and we can't know the keys at compile time.
    getBuild(buildName: string): Build | undefined {
        if (!this.buildsStore) throw new Error("Profile not initialized");

        const allBuilds = this.buildsStore.get("builds") as Builds["builds"];
        return allBuilds[buildName];
    }

    setBuild(buildName: string, build: Build): void {
        if (!this.buildsStore) throw new Error("Profile not initialized");

        const allBuilds = this.buildsStore.get("builds") as Builds["builds"];
        allBuilds[buildName] = build; // Upsert the build to the dict
        this.buildsStore.set("builds", allBuilds);
    }

    /** WARNING - you probably don't want this method! It has very limited use cases! */
    getBuildForProfileId(profileId: "poe1" | "poe2", buildName: string): Build | undefined {
        const buildsStore = this.getBuildsStoreForProfileId(profileId);
        const allBuilds = buildsStore.get("builds") as Builds["builds"];
        return allBuilds[buildName];
    }

    /** WARNING - you probably don't want this method! It has very limited use cases! */
    setBuildForProfileId(profileId: "poe1" | "poe2", buildName: string, build: Build): void {
        const buildsStore = this.getBuildsStoreForProfileId(profileId);
        const allBuilds = buildsStore.get("builds") as Builds["builds"];
        allBuilds[buildName] = build; // Upsert the build to the dict
        buildsStore.set("builds", allBuilds);
    }
}