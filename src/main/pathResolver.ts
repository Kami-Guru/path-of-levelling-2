import { app } from 'electron';
import path from 'path';
import { isDev } from './util.js';
import fs from 'fs/promises';
import { profile } from 'console';

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

//TODO BROKEN FIX THIS
export function getBuildPath(buildName: string) {
	return path.join(
		app.getAppPath(),
		isDev() ? '.' : '..',
		'src/main/Builds',
		buildName
	);
}

export function getBuildsRootPath(profileId: "poe1" | "poe2") {
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

export async function guessClientTxtPath(): Promise<string> {
	var pathGuesses: Array<string> = process.platform === "win32"
		? [
			path.join('C:/Program Files (x86)/Steam/steamapps/common/Path of Exile 2/logs/Client.txt'),
			path.join('D:/SteamLibrary/steamapps/common/Path of Exile 2/logs/Client.txt')
		]
		: [
			path.join(app.getPath('home'), '/.steam/root/steamapps/common/Path of Exile 2/logs/Client.txt'),
		]
	
	var foundPath: string | undefined = undefined
	for (var pathGuess in pathGuesses) {
		try {
			await fs.access(pathGuess, fs.constants.R_OK)

			// If we made it here, .access didn't error so we have a valid path.
			foundPath = pathGuess;
		}
		catch { }

		if (foundPath) break;
	}

	return foundPath ?? getDefaultClientTxtPath();
}

export function getDefaultClientTxtPath(): string {
	return process.platform === "win32" ? getDefaultClientTxtPathWindows() : getDefaultClientTxtPathLinux();
}

export function getDefaultClientTxtPathWindows() {
	return path.join('C:/Program Files (x86)/Steam/steamapps/common/Path of Exile 2/logs/Client.txt');
}

export function getDefaultClientTxtPathLinux() {
	return path.join('/home/punchingbag/.steam/root/steamapps/common/Path of Exile 2/logs/Client.txt');
}

export function getZoneLayoutImagesAbsolutePath() {
	return path.join(
		app.getAppPath(),
		isDev() ? 'assets/Layout Images' : 'dist-react/Layout Images'
	);
}
