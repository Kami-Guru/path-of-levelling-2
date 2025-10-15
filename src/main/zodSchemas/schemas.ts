import { z } from 'zod';

// We define Zod schemas here becuase it makes validation & defaults easy,
// and we also export types based on these schemas so that we can add type safety
// everywhere (eg StoreService's getSetting() has type safety on the key provided
// and output)

// --- Type nesting helper --- //
// Since nested keys in stores are accessed with dot notation (eg .get('key.subkey')) this wrapper
// allows the user to get a collection of all keys in the store, including nested keys, for type
// checking. 

// Limit recursion depth to prevent TS from infinite expansion
type DecrementDepth<D extends number> =
    D extends 5 ? 4 :
    D extends 4 ? 3 :
    D extends 3 ? 2 :
    D extends 2 ? 1 :
    D extends 1 ? 0 : 0;

// Recursive helper: build dot-separated key paths up to Depth
export type NestedKeys<T, Depth extends number = 3> = (
    [Depth] extends [never]
    ? never
    : T extends object
    ? {
        [K in keyof T & string]:
        | K
        | (T[K] extends object
            ? `${K}.${NestedKeys<T[K], DecrementDepth<Depth>>}`
            : never);
    }[keyof T & string]
    : never
);

// Resolve type of a dot path
export type DeepValue<T, Path extends string> =
    Path extends `${infer K}.${infer Rest}`
    ? K extends keyof T
    ? DeepValue<T[K], Rest>
    : never
    : Path extends keyof T
    ? T[Path]
    : never;

// --- Type schemas for the GlobalSettings store --- //
export const ProfileId = z.enum(["poe1", "poe2"]);

export const GlobalSettingsZodSchema = z.object({
    version: z.number().default(1),
    selectedProfile: z.enum(["poe1", "poe2"]).default("poe2"),
});

export type GlobalSettings = z.infer<typeof GlobalSettingsZodSchema>;
export type ProfileId = z.infer<typeof ProfileId>;


// --- Type schemas for the GameSettings store --- //
export const LastSessionStateZodSchema = z.object({
    zoneCode: z.string(),
    playerLevel: z.number(),
    monsterLevel: z.number()
});

export const OverlayPositionZodSchema = z.object({
    x: z.number(),
    y: z.number(),
    height: z.string(),
    width: z.string(),
});

export const UiSettingsZodSchema = z.object({
    settingsOverlayPosition: OverlayPositionZodSchema,
    zoneTrackerPosition: OverlayPositionZodSchema,
    layoutImagesTrackerPosition: OverlayPositionZodSchema,
    levelTrackerPosition: OverlayPositionZodSchema,
    gemTrackerPosition: OverlayPositionZodSchema,
});

export const GameSettingsZodSchema = z.object({
    version: z.number(),
    clientTxtPath: z.string(),
    buildName: z.string(),
    lastSessionState: LastSessionStateZodSchema,
    uiSettings: UiSettingsZodSchema,
});

// Default settings for each profile
// ! These need to basically be exactly the same shape as GameSettingsZodSchema !
export const DefaultPoE1GameSettings = GameSettingsZodSchema.extend({
    version: z.number().default(1),
    clientTxtPath: z.string().default("C:/SteamLibrary/steamapps/common/Path of Exile 1/logs/Client.txt"),
    buildName: z.string().default("Default"),
    lastSessionState: LastSessionStateZodSchema.default({
        zoneCode: "", //TODO what the hell is the first zone in poe1
        monsterLevel: 1,
        playerLevel: 1
    }),
    uiSettings: UiSettingsZodSchema.default({
        settingsOverlayPosition: { x: 665, y: 221, height: "358px", width: "611px" },
        zoneTrackerPosition: { x: 22, y: 24, height: "263px", width: "516px" },
        layoutImagesTrackerPosition: { x: 58, y: 405, height: "200px", width: "400px" },
        levelTrackerPosition: { x: 61, y: 632, height: "19px", width: "335px" },
        gemTrackerPosition: { x: 0, y: 377, height: "53px", width: "516px" },
    }),
})

export const DefaultPoE2GameSettings = GameSettingsZodSchema.extend({
    version: z.number().default(1),
    clientTxtPath: z.string().default("C:/SteamLibrary/steamapps/common/Path of Exile 2/logs/Client.txt"),
    buildName: z.string().default("Default"),
    lastSessionState: LastSessionStateZodSchema.default({
        zoneCode: "G1_1",
        monsterLevel: 1,
        playerLevel: 1
    }),
    uiSettings: UiSettingsZodSchema.default({
        settingsOverlayPosition: { x: 665, y: 221, height: "358px", width: "611px" },
        zoneTrackerPosition: { x: 22, y: 24, height: "263px", width: "516px" },
        layoutImagesTrackerPosition: { x: 58, y: 405, height: "200px", width: "400px" },
        levelTrackerPosition: { x: 61, y: 632, height: "19px", width: "335px" },
        gemTrackerPosition: { x: 0, y: 377, height: "53px", width: "516px" },
    }),
})

export type GameSettings = z.infer<typeof GameSettingsZodSchema>
export type LastSessionState = z.infer<typeof LastSessionStateZodSchema>
export type UiSettings = z.infer<typeof UiSettingsZodSchema>
export type OverlayPosition = z.infer<typeof OverlayPositionZodSchema>


// --- Type schemas for the Builds store --- //
export const GemSetupZodSchema = z.object({
    level: z.number(),
    gemLinks: z.array(z.string()),
    gemSources: z.array(z.string()),
});

export const GemBuildZodSchema = z.object({
    changedByUser: z.boolean(),
    gemSetups: z.array(GemSetupZodSchema)
});

export const BuildZodSchema = z.object({
    buildName: z.string(),
    gemBuild: GemBuildZodSchema,
});

// Builds are stored in a dict like BuildStore.builds["buildName"] = Build
export const BuildStoreZodSchema = z.object({
    version: z.number().default(1),
    builds: z.record(z.string(), BuildZodSchema)
})

export type BuildStore = z.infer<typeof BuildStoreZodSchema>
export type Build = z.infer<typeof BuildZodSchema>
export type GemBuild = z.infer<typeof GemBuildZodSchema>
export type GemSetup = z.infer<typeof GemSetupZodSchema>

// --- Zone Reference Data --- //

export const zoneReferenceZodSchema = z.object({
    name: z.string(),
    code: z.string()
});

export const actReferenceZodSchema = z.object({
    name: z.string(),
    zones: z.array(zoneReferenceZodSchema)
});

export const ZoneReferenceDataZodSchema = z.object({
    acts: z.array(actReferenceZodSchema)
});

export type ZoneReferenceData = z.infer<typeof ZoneReferenceDataZodSchema>;
export type ActReference = z.infer<typeof actReferenceZodSchema>;
export type ZoneReference = z.infer<typeof zoneReferenceZodSchema>;