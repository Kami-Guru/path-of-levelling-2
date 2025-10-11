import Store from "electron-store";
import log from "electron-log"
import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import poe1DefaultSettings from '../profiles/poe1/defaultUnversionedSettings.json' with { type: "json" };
import poe2DefaultSettings from '../profiles/poe2/defaultUnversionedSettings.json' with { type: "json" };
import { Build, DefaultPoE1GameSettings, DefaultPoE2GameSettings, GameSettings, GameSettingsZodSchema, GlobalSettings, GlobalSettingsZodSchema } from "../zodSchemas/schemas.js";
import { getBuildsRootPath, guessClientTxtPath } from "../pathResolver.js";

// Used on startup to migrate any old configuration files to new schemas
export class MigrationService {

    constructor() { }
    
    // Run this method every time on startup - runs a migration from old configuration schemas
    // to new configuration schemas, and fills in missing fields.
    MigrationOnStartup() {
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

        // Do some zod schema validation to fill in missing settings with defaults
        const globalSettingsStore = new Store<GlobalSettings>({
            name: "globalSettings"
        });

        const result = GlobalSettingsZodSchema.safeParse({
            ...GlobalSettingsZodSchema.safeParse({}), // defaults from Zod
            ...globalSettingsStore.store
        })

        if (!result.success) {
            // To have type safety everywhere we need to ensure the global settings conforms to Zod
            // schema, so if safeParse fails log a warning and reset to defaults :(
            log.warn("Failed schema validation on Global Settings with error:",
                z.treeifyError(result.error));

            log.warn("Resetting Global Settings to defaults")
            globalSettingsStore.store = GlobalSettingsZodSchema.parse({})
        } else {
            globalSettingsStore.store = result.data
        }
    }

    private MigratePoE1GameSettings() {
        // Only have version 1 right now so no migration required yet

        // Fill missing settings with defaults from zod schema
        const poe1GameSettingsStore = new Store<GameSettings>({
            name: "poe1-gameSettings"
        })

        const result = GameSettingsZodSchema.safeParse({
            ...DefaultPoE1GameSettings,
            ...poe1GameSettingsStore.store
        })

        if (!result.success) {
            // To have type safety everywhere we need to ensure the PoE1 Game Settings conforms to 
            // Zod schema, so if safeParse fails log a warning and reset to defaults :(
            log.warn("Failed schema validation on PoE1 Game Settings with error:",
                z.treeifyError(result.error));

            log.warn("Resetting PoE1 Game Settings to defaults")
            poe1GameSettingsStore.store = DefaultPoE1GameSettings.parse({})
        } else {
            poe1GameSettingsStore.store = result.data
        }
    }

    private async MigratePoE2GameSettings() {
        // Only have version 1 right now so no migration required yet

        // Fill missing settings with defaults from zod schema
        const poe2GameSettingsStore = new Store<GameSettings>({
            name: "poe2-gameSettings"
        })

        // When filling in missing client txt path, make a few guesses.
        const clientTxtPath = poe2GameSettingsStore.get("clientTxtPath")
            ?? await guessClientTxtPath(); 

        const result = GameSettingsZodSchema.safeParse({
            ...DefaultPoE2GameSettings,
            ...poe2GameSettingsStore.store,
            clientTxtPath: clientTxtPath
        })

        if (!result.success) {
            // To have type safety everywhere we need to ensure the poe2 game settings conforms to 
            // Zod schema, so if safeParse fails log a warning and reset to defaults :(
            log.warn("Failed schema validation on PoE2 Game Settings with error:",
                z.treeifyError(result.error));

            log.warn("Resetting PoE2 Game Settings to defaults")
            poe2GameSettingsStore.store = DefaultPoE2GameSettings.parse({})
        } else {
            poe2GameSettingsStore.store = result.data
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
            if (!storeService.getBuildForProfileId("poe1", buildName)) {
                storeService.setBuildForProfileId("poe1", buildName, buildData);
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
            if (!storeService.getBuildForProfileId("poe2", buildName)) {
                storeService.setBuildForProfileId("poe2", buildName, buildData);
            }
        }
    }

    // --- Global Settings Migrators --- //
    private MigrateGlobalSettingsUnversionedToV1() {
        const oldSettingsStore = new Store(); // opens /~userData~/config.json
        const oldData = oldSettingsStore.store;

        // If there are no old settings, no migration required.
        // TODO not sold on the idea that !oldData is actually going to return false
        if (!oldData)
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
        const poe1SettingsStore = new Store({ name: "poe2-gameSettings" })

        poe1SettingsStore.set('version', 1);
        poe1SettingsStore.set('clientTxtPath', poe1DefaultSettings.clientTxtPath);
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

        // If there are no old settings, no migration required.
        // TODO not sold on the idea that !oldData is actually going to return false
        if (!oldBuildStore)
            return;

        // Old build store was just a collection of properties named after the build whose values
        // were the actual build, i.e.
        // {
        //      "0.3.0 CaptainLance9's Archon Blood Mage": {... actual build here ...}
        // }
        // So we have to iterate through all the properties in the store and map those into the new
        // builds dict
        const newBuildStore = new Store({
            name: "poe2-builds",
            accessPropertiesByDotNotation: false
        })

        newBuildStore.set('version', 1);

        const migratedBuilds: Record<string, object> = {};
        // TODO need to test that this works, type hints say it does (buildName is a string)
        for (const buildName in oldBuildStore.store) {
            migratedBuilds[buildName] = oldBuildStore.get(buildName) as object;
        }

        newBuildStore.set('builds', migratedBuilds)

        // Clear the old builds store
        oldBuildStore.clear
    }
}

