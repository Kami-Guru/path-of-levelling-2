import { app } from 'electron';
import path from 'path';
import { isDev } from './util.js';

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

export function getBuildPath(buildFolder: string) {
	return path.join(
		app.getAppPath(),
		isDev() ? '.' : '..',
		'src/main/Builds',
		buildFolder
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

export function getClientTxtPath(): string {
	return process.platform === "win32" ? getClientTxtPathWindows() : getClientTxtPathLinux();
}

export function getClientTxtPathWSL() {
	return path.join(
		'/mnt/d/SteamLibrary/steamapps/common/Path of Exile 2/logs/Client.txt'
	);
}

export function getClientTxtPathWindows() {
	return path.join('D:/SteamLibrary/steamapps/common/Path of Exile 2/logs/Client.txt');
}

export function getClientTxtPathLinux() {
	return path.join('/home/punchingbag/.steam/root/steamapps/common/Path of Exile 2/logs/Client.txt');
}

export function getZoneLayoutImagesAbsolutePath() {
	return path.join(
		app.getAppPath(),
		isDev() ? 'assets/Layout Images' : 'dist-react/Layout Images'
	);
}
