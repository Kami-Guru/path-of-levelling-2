import { app } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import { ProfileId } from './zodSchemas/schemas.js';
import { getProfile } from './profiles/profiles.js';

export function isDev(): boolean {
	return process.env.NODE_ENV === 'development';
}

export function getPreloadPath() {
	return path.join(
		app.getAppPath(),
		isDev() ? '.' : '..', // Need to escape app.asar in production for any files listed in electron-builder.json
		'/dist-electron/ipc/preload.cjs' // Needs to be cjs so that it is compiled separately and can be accessed after compilation.
	);
}

export function getUIPath() {
	return path.join(app.getAppPath(), '/dist-react/index.html');
}

export function getDesktopIconPath() {
	return path.join(
		app.getAppPath(),
		isDev() ? 'assets' : 'dist-react',
		process.platform === "win32" ? "icon.ico" : "icon.png"
	);
}

export function getZoneNotesPath(): string {
	// One day there will be per-build zone notes, but for now it's all in Default/zoneNotes.json
	return path.join(getBuildPath('Default'), 'zoneNotes.json')
}

//TODO BROKEN FIX THIS
export function getBuildPath(buildName: string) {
	return path.join(
		app.getAppPath(),
		isDev() ? '.' : '..',
		'src/main/Builds',
		buildName
	);
}

export function getBuildsRootPath(profileId: ProfileId) {
	return path.join(
		app.getAppPath(),
		isDev() ? '.' : '..',
		'src/main/profiles/',
		profileId,
		'/Builds',
	);
}

export function getDefaultSettingsPath() {
	return path.join(
		app.getAppPath(),
		isDev() ? '.' : '..',
		'src/main/Settings',
		'defaultSettings.json'
	);
}

export async function guessClientTxtPathForProfileId(profileId: ProfileId): Promise<string> {
	const pathGuesses = getProfile(profileId).logFilePathGuesses;

	var foundPath: string | undefined = undefined
	for (var pathGuess in pathGuesses) {
		try {
			await fs.access(pathGuess, fs.constants.R_OK)

			// If we made it here, .access didn't error so we have a valid path.
			foundPath = pathGuess;
		}
		catch {
			// fs.access threw so that path is invalid, continue guessing
			continue;
		}

		if (foundPath) break;
	}

	return foundPath ?? getProfile(profileId).defaultLogFilePath;
}

//TODO BROKEN FIX THIS
export function getZoneLayoutImagesAbsolutePath() {
	return path.join(
		app.getAppPath(),
		isDev() ? 'assets/Layout Images' : 'dist-react/Layout Images'
	);
}
