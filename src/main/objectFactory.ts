import { LogWatcherService } from "./services/LogWatcherService.js";
import { MigrationService } from "./services/MigrationService.js";
import { SettingsService } from "./services/Settings.js";
import { StoreService } from "./services/StoreService.js";
import { GemTracker } from "./trackers/GemTracker.js";
import { LevelTracker } from "./trackers/LevelTracker.js";
import { StateTracker } from "./trackers/StateTracker.js";
import { ZoneTracker } from "./trackers/ZoneTracker.js";

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
    private getOrCreateService<K extends keyof ServicesAndTrackers>(
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

    // --- StoreService --- //
    getStoreService(): StoreService {
        return this.getOrCreateService("storeService", () => new StoreService());
    }

    // --- MigrationService --- //
    getMigrationService(): MigrationService {
        return this.getOrCreateService("migrationService", () => new MigrationService());
    }

    // --- LogWatcherService --- //
    getLogWatcherService(): LogWatcherService {
        return this.getOrCreateService("logWatcherService", () => new LogWatcherService());
    }
}

export const objectFactory = ObjectFactory.instance;
