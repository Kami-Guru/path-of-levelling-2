import { poe1Profile } from "./poe1/PoE1Profile.js";
import { poe2Profile } from "./poe2/PoE2Profile.js";

export interface GameProfile {
    Id: "poe1" | "poe2";
    windowName: "Path of Exile 1" | "Path of Exile 2"
    // Paths
    logFilePathGuesses: string[];
    assetDir: string;
    configFile: string;

    // Optional: profile-specific log line parsing
}

const profiles: Record<string, GameProfile> = {
    poe1: poe1Profile,
    poe2: poe2Profile
}

export function getProfile(id: string): GameProfile {
    return profiles[id] ?? poe2Profile
}
