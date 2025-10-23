import { app } from "electron";
import { getProfile } from "./profiles/profiles.js";
import { LogWatcherService } from "./services/LogWatcherService.js";
import { MigrationService } from "./services/MigrationService.js";
import { SettingsService } from "./services/Settings.js";
import { StoreService } from "./services/StoreService.js";
import { GemTracker } from "./trackers/GemTracker.js";
import { LevelTracker } from "./trackers/LevelTracker.js";
import { StateTracker } from "./trackers/StateTracker.js";
import { ZoneTracker } from "./trackers/ZoneTracker.js";
import { ProfileId } from "./zodSchemas/schemas.js";
import log from 'electron-log';


type Services = {
    storeService: StoreService;
    settingsService: SettingsService;
    migrationService: MigrationService;
    logWatcherService: LogWatcherService;
}

type Trackers = {
    stateTracker: StateTracker;
    zoneTracker: ZoneTracker,
    levelTracker: LevelTracker,
    gemTracker: GemTracker
}

// Union type for ObjectFactory's getOrCreate
type ServicesAndTrackers = Services & Trackers;

/**
 * Lightweight singleton service locator with lazy initialization and dependency awareness.
 */
class ObjectFactory {
    private static _instance: ObjectFactory | null = null;

    static get instance(): ObjectFactory {
        if (!ObjectFactory._instance) {
            ObjectFactory._instance = new ObjectFactory();
        }
        return ObjectFactory._instance;
    }

    // --- Instance Members --- //
    private objects: Partial<ServicesAndTrackers> = {};

    private constructor() { }

    // Generic helper for lazy init - call with 
    // this.getOrCreate("someService", () => {
    //     const someDependency = this.getDependency();
    //     return new SomeService(someDependency)
    // });
    private getOrCreateObject<K extends keyof ServicesAndTrackers>(
        key: K,
        factory: () => ServicesAndTrackers[K]
    ): ServicesAndTrackers[K] {
        if (!this.objects[key]) {
            const service = factory();
            service.init();
            this.objects[key] = service;
        }
        return this.objects[key]!;
    }

    public switchProfile(profileId: ProfileId) {
        // Check if we even need to change
        if (profileId === getProfile().Id) {
            return;
        }

        // Save the new profile then restart app
        this.getStoreService().setGlobalSetting('selectedProfile', profileId);

        log.info(`Switching profile to ${profileId}, restarting app...`);
        app.relaunch();
        app.exit(0);
    }

    // --- Services --- //
    getStoreService(): StoreService {
        return this.getOrCreateObject("storeService", () => new StoreService());
    }

    getSettingsService(): SettingsService {
        return this.getOrCreateObject("settingsService", () => new SettingsService());
    }

    getMigrationService(): MigrationService {
        return this.getOrCreateObject("migrationService", () => new MigrationService());
    }

    getLogWatcherService(): LogWatcherService {
        return this.getOrCreateObject("logWatcherService", () => new LogWatcherService());
    }


    // --- Trackers --- //
    getStateTracker(): StateTracker {
        return this.getOrCreateObject("stateTracker", () => new StateTracker());
    }

    getZoneTracker(): ZoneTracker {
        return this.getOrCreateObject("zoneTracker", () => {
            const storeService = this.getStoreService();
            return new ZoneTracker(storeService)
        })
    }

    getLevelTracker(): LevelTracker {
        return this.getOrCreateObject("levelTracker", () => {
            const storeService = this.getStoreService();
            return new LevelTracker(storeService)
        })
    }

    getGemTracker(): GemTracker {
        return this.getOrCreateObject("gemTracker", () => {
            const settingsService = this.getSettingsService();
            const levelTracker = this.getLevelTracker();
            return new GemTracker(settingsService, levelTracker)
        })
    }
}

export const objectFactory = ObjectFactory.instance;
