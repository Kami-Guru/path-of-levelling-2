import { ProfileId } from "../zodSchemas/schemas.js";
import { poe1Profile } from "./poe1/PoE1Profile.js";
import { poe2Profile } from "./poe2/PoE2Profile.js";

export interface GameProfile {
    Id: ProfileId;
    windowName: "Path of Exile 1" | "Path of Exile 2"
    // Paths
    defaultLogFilePath: string;
    logFilePathGuesses: string[];

    // Optional: profile-specific log line parsing
}

const profiles: Record<ProfileId, GameProfile> = {
    poe1: poe1Profile,
    poe2: poe2Profile
}

/** Returns the current profile, or the profile corresponding to ProfileId if provided */
export function getProfile(id: ProfileId | null = null): GameProfile {
    return profiles[id ?? storeService.getSelectedProfileId()]
}
