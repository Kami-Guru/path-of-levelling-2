import { app } from "electron";
import path from "path";
import fs from "fs";
import { ProfileId } from "./zodSchemas/schemas.js";
import { getProfile } from "./profiles/profiles.js";

export function isDev(): boolean {
	return process.env.NODE_ENV === "development";
}

export function getPreloadPath() {
	return path.join(
		app.getAppPath(),
		isDev() ? "." : "..", // Need to escape app.asar in production for any files listed in electron-builder.json
		"/dist-electron/ipc/preload.cjs" // Needs to be cjs so that it is compiled separately and can be accessed after compilation.
	);
}

export function getUIPath() {
	return path.join(app.getAppPath(), "/dist-react/index.html");
}

export function getDesktopIconPath() {
	return path.join(
		app.getAppPath(),
		isDev() ? "assets" : "dist-react",
		process.platform === "win32" ? "icon.ico" : "icon.png"
	);
}

export function getZoneNotesPath(profileId: ProfileId): string {
	// One day there will be per-build zone notes, but for now it's all in Default/zoneNotes.json
	return path.join(getBuildPath(profileId, "Default"), "zoneNotes.json");
}

export function getZoneReferenceDataPath(profileId: ProfileId): string {
	return path.join(getProfilePath(profileId), "referenceData", "zoneReferenceData.json");
}

export function getZoneLayoutImagesAbsolutePath() {
	return path.join(
		app.getAppPath(),
		isDev() ? "assets/Layout Images" : "dist-react/Layout Images",
		getProfile().Id
	);
}

export function getBuildPath(profileId: ProfileId, buildName: string) {
	return path.join(getProfilePath(profileId), "/builds/", buildName);
}

export function getBuildsRootPath(profileId: ProfileId) {
	return path.join(getProfilePath(profileId), "/builds");
}

export function getProfilePath(profileId: ProfileId) {
	return path.join(app.getAppPath(), isDev() ? "." : "..", "src/main/profiles/", profileId);
}

/** Guesses a few file paths, if none are valid then return default */
export function guessClientTxtPathForProfileId(profileId: ProfileId): string {
	const pathGuesses = getProfile(profileId).logFilePathGuesses;

	var foundPath: string | undefined = undefined;
	for (var pathGuess in pathGuesses) {
		try {
			fs.accessSync(pathGuess, fs.constants.R_OK);

			// If we made it here, .access didn't error so we have a valid path.
			foundPath = pathGuess;
		} catch {
			// fs.access threw so that path is invalid, continue guessing
			continue;
		}

		if (foundPath) break;
	}

	return foundPath ?? getProfile(profileId).defaultClientTxtPath;
}
