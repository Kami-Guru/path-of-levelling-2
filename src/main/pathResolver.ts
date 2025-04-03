import { app } from 'electron';
import path from 'path';
import { isDev } from './util.js';

export function getPreloadPath() {
	return path.join(
		app.getAppPath(),
		isDev() ? '.' : '..', //Need to escape app.asar in production for any files listed in electron-builder.json
		'/dist-electron/ipc/preload.cjs' //Needs to be cjs so that it is compiled separately and can be accessed after compilation.
	);
}

export function getUIPath() {
	return path.join(app.getAppPath(), '/dist-react/index.html');
}

export function getDesktopIconPath() {
	return path.join(
		app.getAppPath(),
		isDev() ? 'assets/icon.ico' : 'dist-react/icon.ico'
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
	return getClientTxtPathWindows();
	//this is for when I'm developing on WSL
	//return isDev() ? getClientTxtPathWSL() : getClientTxtPathWindows();
}

export function getClientTxtPathWSL() {
	return path.join(
		'/mnt/d/SteamLibrary/steamapps/common/Path of Exile 2/logs/Client.txt'
	);
}

export function getClientTxtPathWindows() {
	return path.join('D:/SteamLibrary/steamapps/common/Path of Exile 2/logs/Client.txt');
}

export function getZoneLayoutImagesAbsolutePath() {
	return path.join(app.getAppPath(), 'assets/Layout Images');
}
