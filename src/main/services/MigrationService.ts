import Store from "electron-store";
import log from "electron-log"
import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import poe1DefaultSettings from '../profiles/poe1/defaultUnversionedSettings.json' with { type: "json" };
import poe2DefaultSettings from '../profiles/poe2/defaultUnversionedSettings.json' with { type: "json" };
import { Build, DefaultPoE1GameSettings, DefaultPoE2GameSettings, GameSettingsZodSchema, GlobalSettingsZodSchema } from "../zodSchemas/schemas.js";
import { getBuildsRootPath, guessClientTxtPathForProfileId } from "../pathResolver.js";
import { objectFactory } from "../objectFactory.js";

// Used on startup to migrate any old configuration files to new schemas
export class MigrationService {

    constructor() {
        log.info("MigrationService constructed");
    }

    init() {
        log.info("MigrationService initialised");
    }

    // Run this method every time on startup - runs a migration from old configuration schemas
    // to new configuration schemas, and fills in missing fields.
    async MigrateOnStartup() {
        this.MigrateGlobalSettings();
        this.MigratePoE1GameSettings();
        this.MigratePoE2GameSettings();
        this.MigrateBuilds();
    }

    private MigrateGlobalSettings() {
        // First need to migrate unversioned files - should just have just added a version day 1 :(
        this.MigrateGlobalSettingsUnversionedToV1()

        // In future I can do this:
        /*  const migrations = {
                1: (settingsStore) => {return MigrateGlobalSettingsV1ToV2(settingsStore)} // output new version (2)
                2: (settingsStore) => {return MigrateGlobalSettingsV2ToV3(settingsStore)} // output new version (3)
                etc
            }
            
            Keep calling migrations[currentVersion] until it returns undefined, i.e. there is no 
            required migration
            while (migrations[currentVersion]) {
                settingsStore = new Store({named: "globalSettings"});
                currentVersion = migrations[currentVersion](settingsStore)
            }
        */

        // --- Fill missing settings with defaults from zod schema --- //
        const globalSettings = objectFactory.getStoreService().getAllGlobalSettings();

        const dataValidationResult = this.FillWithDefaultsAndStrip(
            GlobalSettingsZodSchema,
            GlobalSettingsZodSchema.parse({}),
            globalSettings
        )

        if (!dataValidationResult) return; // No changes required

        if (dataValidationResult.success) {
            log.warn("Stripping unknown keys and filling missing Global Settings with defaults");
            objectFactory.getStoreService().setAllGlobalSettings(dataValidationResult.data);
            return;
        } else {
            log.warn("Resetting Global Settings to defaults");
            objectFactory.getStoreService().setAllGlobalSettings(GlobalSettingsZodSchema.parse({}));
        }
    }

    private MigratePoE1GameSettings() {
        // Only have version 1 right now so no migration required yet

        // --- Fill missing settings with defaults from zod schema --- //
        const poe1GameSettings = objectFactory.getStoreService().getAllGameSettingsForProfileId("poe1");

        const dataValidationResult = this.FillWithDefaultsAndStrip(
            GameSettingsZodSchema,
            DefaultPoE1GameSettings.parse({}),
            poe1GameSettings
        )

        if (!dataValidationResult) return; // No changes required

        // If the dataValidationResult.success is true, the data just needed to be filled with
        // defaults and/or stripped of extra keys. If false, the data was too broken to fix.
        if (dataValidationResult.success) {
            log.warn("Filling missing PoE1 Game Settings with defaults");
            objectFactory.getStoreService().setAllGameSettingsForProfileId("poe1", dataValidationResult.data);
        } else {
            log.warn("Resetting PoE1 Game Settings to defaults");
            objectFactory.getStoreService().setAllGameSettingsForProfileId("poe1", DefaultPoE1GameSettings.parse({}));
        }
    }

    private MigratePoE2GameSettings() {
        // Only have version 1 right now so no migration required yet

        // --- Fill missing settings with defaults from zod schema --- //
        const poe2GameSettings = objectFactory.getStoreService().getAllGameSettingsForProfileId("poe2");

        const dataValidationResult = this.FillWithDefaultsAndStrip(
            GameSettingsZodSchema,
            DefaultPoE2GameSettings.parse({}),
            poe2GameSettings
        )

        if (!dataValidationResult) return; // No changes required

        if (dataValidationResult.success) {
            log.warn("Filling missing PoE2 Game Settings with defaults");
            objectFactory.getStoreService().setAllGameSettingsForProfileId("poe2", dataValidationResult.data);
        } else {
            log.warn("Resetting PoE2 Game Settings to defaults");
            objectFactory.getStoreService().setAllGameSettingsForProfileId("poe2", DefaultPoE2GameSettings.parse({}));
        }
    }

    private MigrateBuilds() {
        this.MigrateBuildStoresUnversionedToV1()

        // Fill missing default builds - PoE1
        const poe1BuildsDir = getBuildsRootPath("poe1");
        const poe1BuildFolders = fs.readdirSync(poe1BuildsDir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory()
                && dirent.name !== "template")
            .map(dirent => dirent.name);

        for (const folder of poe1BuildFolders) {
            const buildPath = path.join(poe1BuildsDir, folder, 'build.json');
            if (!fs.existsSync(buildPath)) continue;

            const buildData = JSON.parse(fs.readFileSync(buildPath, 'utf-8')) as Build;
            const buildName = buildData.buildName;
            if (!objectFactory.getStoreService().getBuildForProfileId("poe1", buildName)) {
                objectFactory.getStoreService().setBuildForProfileId("poe1", buildName, buildData);
            }
        }

        // Fill missing default builds - PoE2
        const poe2BuildsDir = getBuildsRootPath("poe2");
        const poe2BuildFolders = fs.readdirSync(poe2BuildsDir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory()
                && dirent.name !== "template")
            .map(dirent => dirent.name);

        for (const folder of poe2BuildFolders) {
            const buildPath = path.join(poe2BuildsDir, folder, 'build.json');
            if (!fs.existsSync(buildPath)) continue;

            const buildData = JSON.parse(fs.readFileSync(buildPath, 'utf-8')) as Build;
            const buildName = buildData.buildName;
            if (!objectFactory.getStoreService().getBuildForProfileId("poe2", buildName)) {
                objectFactory.getStoreService().setBuildForProfileId("poe2", buildName, buildData);
            }
        }
    }

    // --- Global Settings Migrators --- //
    private MigrateGlobalSettingsUnversionedToV1() {
        const oldSettingsStore = new Store(); // opens /~userData~/config.json
        const oldData = oldSettingsStore.store;

        // If there are no old settings, no migration required.
        if (!oldData || oldSettingsStore.size === 0)
            return;

        // Back in ye olde days 'buildName' was 'buildFolder'
        if (oldSettingsStore.get('buildFolder')) {
            oldSettingsStore.set('buildName', oldSettingsStore.get('buildFolder'));
            oldSettingsStore.delete('buildFolder');
        }

        // Originally this app only supported poe2 and had one settings file - now there is a global
        // settings file and a settings file for poe1 and poe2.
        const globalSettingsStore = new Store({
            name: "globalSettings"
        })
        globalSettingsStore.set('version', 1);
        globalSettingsStore.set('selectedProfile', "poe2");

        // poe2 settings we can pull from the old file
        const poe2SettingsStore = new Store({ name: "poe2-gameSettings" });

        poe2SettingsStore.set('version', 1);
        poe2SettingsStore.set('clientTxtPath', oldSettingsStore.get('clientTxtPath') ?? poe2DefaultSettings.clientTxtPath);
        poe2SettingsStore.set('buildName', oldSettingsStore.get('buildName') ?? poe2DefaultSettings.buildName);
        poe2SettingsStore.set('lastSessionState', oldSettingsStore.get('lastSessionState') ?? poe2DefaultSettings.lastSessionState);
        poe2SettingsStore.set('uiSettings', oldSettingsStore.get('uiSettings') ?? poe2DefaultSettings.uiSettings);

        // poe1 settings we just fill with defaults
        const poe1SettingsStore = new Store({ name: "poe1-gameSettings" })

        poe1SettingsStore.set('version', 1);
        // For clientTxtPath we try to make a few guesses before falling back to the default
        poe1SettingsStore.set('clientTxtPath', guessClientTxtPathForProfileId("poe1"));
        poe1SettingsStore.set('buildName', poe1DefaultSettings.buildName)
        poe1SettingsStore.set('lastSessionState', poe1DefaultSettings.lastSessionState)
        poe1SettingsStore.set('uiSettings', poe1DefaultSettings.uiSettings)

        // Now delete the old settings store
        oldSettingsStore.clear();
    }

    // --- Builds Migrators --- //
    private MigrateBuildStoresUnversionedToV1() {
        const oldBuildStore = new Store({
            name: "builds",
            accessPropertiesByDotNotation: false // So ppl can use . in build names (eg 3.27 LA)
        })
        const oldData = oldBuildStore.store;

        // If there are no old settings, no migration required.
        if (!oldData || oldBuildStore.size === 0)
            return;

        // Old build store was just a collection of properties named after the build whose values
        // were the actual build, i.e.
        // {
        //      "0.3.0 CaptainLance9's Archon Blood Mage": {... actual build here ...}
        // }
        // So we have to iterate through all the properties in the store and map those into the new
        // builds dict
        const poe2newBuildStore = new Store({
            name: "poe2-builds",
            accessPropertiesByDotNotation: false
        })

        poe2newBuildStore.set('version', 1);

        const migratedBuilds: Record<string, object> = {};
        for (const buildName in oldBuildStore.store) {
            const oldBuild = oldBuildStore.get(buildName) as object;
            Object.assign(oldBuild, { "actNotes": [] });
            migratedBuilds[buildName] = oldBuild;
        }

        poe2newBuildStore.set('builds', migratedBuilds)

        // There was never a poe1 builds store, so we just create an empty one
        const poe1newBuildStore = new Store({
            name: "poe1-builds",
            accessPropertiesByDotNotation: false
        })
        poe1newBuildStore.set('version', 1);
        poe1newBuildStore.set('builds', {});

        // Clear the old builds store
        oldBuildStore.clear()
    }

    /** Checks existing settings, trims extra keys and fills defaults.
     * Returns undefined if no changes are required.
     */
    private FillWithDefaultsAndStrip<T extends z.ZodObject<any>>(schema: T, defaults: z.infer<T>, current: object)
        : z.ZodSafeParseResult<z.infer<T>> | undefined {

        // First check that there are missing settings at all, or any extra keys
        var alreadyValidCheck = schema.safeParse(current);
        if (alreadyValidCheck.success && Object.keys(alreadyValidCheck.data).length === Object.keys(current).length)
            return; // No missing settings or extra keys. yeah returning undefined is yuck, whatever

        log.warn("Failed schema validation on Global Settings:",
            alreadyValidCheck.error === undefined
                ? "Unrecognised keys!"
                : z.treeifyError(alreadyValidCheck.error));

        // Fill in missing settings with defaults and strip extra keys at the same time.
        // Return result of the safeParse - too hard to automate which store to write to 
        return schema.safeParse({
            ...defaults,
            ...current
        })
    }
}

