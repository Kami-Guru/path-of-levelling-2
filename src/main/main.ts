import { app, BrowserWindow, globalShortcut, ipcMain, Menu, Tray } from 'electron';
import { OVERLAY_WINDOW_OPTS, OverlayController } from 'electron-overlay-window';
import electronUpdater, { type AppUpdater } from 'electron-updater';
import path from 'path';
import { LogWatcher } from './LogWatcher.js';
import { getDesktopIconPath, getPreloadPath, getUIPath } from './pathResolver.js';
import { Settings } from './Settings/Settings.js';
import { StateTracker } from './trackers/StateTracker.js';
import { isDev } from './util.js';

declare global {
	var settings: Settings;
	var mainState: StateTracker;
}

export function getAutoUpdater(): AppUpdater {
	// Using destructuring to access autoUpdater due to the CommonJS module of 'electron-updater'.
	// It is a workaround for ESM compatibility issues, see https://github.com/electron-userland/electron-builder/issues/7976.
	const { autoUpdater } = electronUpdater;
	return autoUpdater;
}

app.whenReady().then(() => {
	setTimeout(
		createWindow,
		process.platform === 'linux' ? 1000 : 0 // https://github.com/electron/electron/issues/16809
	);

	// Auto updates
	getAutoUpdater().checkForUpdatesAndNotify();
});

function createWindow() {
	// Set up the tray
	const tray = new Tray(path.join(getDesktopIconPath()));
	tray.setToolTip(`Path Of Levelling 2 v${app.getVersion()}`);

	tray.setContextMenu(
		Menu.buildFromTemplate([
			{
				label: 'Quit',
				click: () => {
					app.quit();
				},
			},
		])
	);

	// Set up main window
	const mainWindow = new BrowserWindow({
		...OVERLAY_WINDOW_OPTS,
		webPreferences: {
			//nodeIntegration: true,
			preload: path.join(getPreloadPath()),
		},
	});

	if (isDev()) {
		mainWindow.loadURL('http://localhost:5123');
	} else {
		mainWindow.loadFile(path.join(getUIPath()));
	}

	if (isDev()) {
		mainWindow.webContents.openDevTools();
	}

	OverlayController.attachByTitle(
		mainWindow,
		//isDev() ? 'Untitled - Notepad' : 'Path of Exile 2'
		'Path of Exile 2'
	);

	// Declare global singletons
	// cringe to use global variables but this makes it really easy to pass around state
	// so whatever. State constructor relies on global settings existing.
	globalThis.settings = new Settings();
	globalThis.mainState = new StateTracker();

	// This basically runs the loop of read lines, save state, post state to renderer,
	// rinse and repeat.
	const logWatcher = new LogWatcher();
	logWatcher.watchClientTxt(mainWindow);

	createIPCEventListeners(mainWindow, logWatcher);

	registerGlobalHotkeys(mainWindow);

	//---------------testing
	OverlayController.events.addListener('blur', () => {
		mainWindow.show();
	});

	// Uh still unfamiliar with this package so just logging all events
	LogOverlayEventCalls();
}

function createIPCEventListeners(mainWindow: BrowserWindow, logWatcher: LogWatcher) {
	// Handle events from the settings overlay
	ipcMain.handle('getClientPath', async (event) => {
		return settings.getClientTxtPath();
	});
	ipcMain.handle('saveClientPath', async (event, clientTxtPath: string) => {
		var result = settings.saveClientTxtPath(clientTxtPath, mainWindow, logWatcher);
		return result;
	});

	ipcMain.handle('getIsClientWatcherActive', async (event) => {
		return mainState.getIsClientWatcherActive();
	});

	// Handle events from the zone tracker
	ipcMain.handle('getZoneState', async (event, args) => {
		mainWindow.webContents.send(
			'zoneLayoutImageUpdates',
			mainState.ZoneTracker.zoneImageFilePaths
		);
		return mainState.ZoneTracker;
	});

	ipcMain.handle('postActSelected', async (event, actSelected: string) => {
		mainState.ZoneTracker.saveZoneFromActName(actSelected);
		mainWindow.webContents.send(
			'zoneLayoutImageUpdates',
			mainState.ZoneTracker.zoneImageFilePaths
		);
		return mainState.ZoneTracker;
	});

	ipcMain.handle(
		'postZoneSelected',
		async (event, zoneSelected: string, actSelected: string) => {
			mainState.ZoneTracker.saveZoneFromZoneNameAndActName(
				zoneSelected,
				actSelected
			);
			mainWindow.webContents.send(
				'zoneLayoutImageUpdates',
				mainState.ZoneTracker.zoneImageFilePaths
			);
			return mainState.ZoneTracker;
		}
	);

	ipcMain.handle('getLayoutImagePaths', async (event, args) => {
		return mainState.ZoneTracker.zoneImageFilePaths;
	});

	// Handle events from the level tracker
	ipcMain.handle('getLevelState', async (event, args) => {
		return mainState.LevelTracker;
	});

	// Handle events from the gem tracker
	ipcMain.handle('getGemState', async (event, args) => {
		return mainState.GemTracker;
	});

	ipcMain.handle('postGemLevelSelected', async (event, gemLevelSelected: number) => {
		mainState.GemTracker.saveGemSetupFromPlayerLevel(gemLevelSelected);
		return mainState.GemTracker;
	});

	// Handle UI window position events
	ipcMain.handle('getSettingsOverlayPositionSettings', async (event, args) => {
		return settings.getSettingsOverlayPositionSettings();
	});

	ipcMain.handle(
		'saveSettingsOverlayPositionSettings',
		async (event, settingsOverlaySettings) => {
			settings.saveSettingsOverlayPositionSettings(settingsOverlaySettings);
		}
	);

	ipcMain.handle('getZoneOverlayPositionSettings', async (event, args) => {
		return settings.getZoneOverlayPositionSettings();
	});

	ipcMain.handle('saveZoneOverlayPositionSettings', async (event, zoneSettings) => {
		settings.saveZoneOverlayPositionSettings(zoneSettings);
	});

	ipcMain.handle('getLayoutImagesOverlayPositionSettings', async (event, args) => {
		return settings.getLayoutImagesOverlayPositionSettings();
	});

	ipcMain.handle(
		'saveLayoutImagesOverlayPositionSettings',
		async (event, layoutImageSettings) => {
			settings.saveLayoutImagesOverlayPositionSettings(layoutImageSettings);
		}
	);

	ipcMain.handle('getLevelOverlayPositionSettings', async (event, args) => {
		return settings.getLevelOverlayPositionSettings();
	});

	ipcMain.handle('saveLevelOverlayPositionSettings', async (event, levelSettings) => {
		settings.saveLevelOverlayPositionSettings(levelSettings);
	});

	ipcMain.handle('getGemOverlayPositionSettings', async (event, args) => {
		return settings.getGemOverlayPositionSettings();
	});

	ipcMain.handle('saveGemOverlayPositionSettings', async (event, gemSettings) => {
		settings.saveGemOverlayPositionSettings(gemSettings);
	});
}

function registerGlobalHotkeys(mainWindow: BrowserWindow) {
	//Show/hide settings - default hidden
	globalShortcut.register('Ctrl+Alt+S', () => {
		mainState.settingsOpen = !mainState.settingsOpen;
		// Push settings open/closed to frontend
		mainWindow.webContents.send('Hotkeys', {
			Hotkey: 'ToggleSettings',
			value: mainState.settingsOpen,
		});
		// Enable clicks on overlay
		mainWindow.setIgnoreMouseEvents(!mainState.settingsOpen);
	});
	//Show/hide zone notes - default shown
	globalShortcut.register('Ctrl+Alt+z', () => {
		mainState.zoneNotesOpen = !mainState.zoneNotesOpen;
		// Push settings open/closed to frontend
		mainWindow.webContents.send('Hotkeys', {
			Hotkey: 'ToggleZoneNotes',
			value: mainState.zoneNotesOpen,
		});
	});
	//Show/hide layout images - default shown
	globalShortcut.register('Ctrl+Alt+i', () => {
		mainState.layoutImagesOpen = !mainState.layoutImagesOpen;
		// Push settings open/closed to frontend
		mainWindow.webContents.send('Hotkeys', {
			Hotkey: 'ToggleLayoutImages',
			value: mainState.layoutImagesOpen,
		});
	});
	//Show/hide level tracker - default shown
	globalShortcut.register('Ctrl+Alt+l', () => {
		mainState.levelTrackerOpen = !mainState.levelTrackerOpen;
		// Push settings open/closed to frontend
		mainWindow.webContents.send('Hotkeys', {
			Hotkey: 'ToggleLevelTracker',
			value: mainState.levelTrackerOpen,
		});
	});
	//TODO add gems hotkey when it works :))
}

//-----------------------testing
function LogOverlayEventCalls() {
	// Still getting used to the events so uhhhhh just log when all of them are used.
	OverlayController.events.addListener('attach', () => {
		console.log('attach event emitted ');
	});

	OverlayController.events.addListener('fullscreen', () => {
		console.log('fullscreen event emitted ');
	});

	OverlayController.events.addListener('detach', () => {
		console.log('detach event emitted ');
	});

	OverlayController.events.addListener('moveresize', () => {
		console.log('moveresize event emitted ');
	});

	OverlayController.events.addListener('blur', () => {
		console.log('blur event emitted ');
	});

	OverlayController.events.addListener('focus', () => {
		console.log('focus event emitted ');
	});
}
