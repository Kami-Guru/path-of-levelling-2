import {
	app,
	BrowserWindow,
	globalShortcut,
	ipcMain,
	Menu,
	screen,
	Tray,
	nativeImage,
} from 'electron';
import log from 'electron-log';
import { OVERLAY_WINDOW_OPTS, OverlayController } from 'electron-overlay-window';
import electronUpdater, { type AppUpdater } from 'electron-updater';
import path from 'path';
import { LogWatcherService } from './services/LogWatcherService.js';
import { getDesktopIconPath, getPreloadPath, getUIPath, isDev } from './pathResolver.js';
import { objectFactory } from './objectFactory.js';
import { getProfile } from './profiles/profiles.js';
import { GemSetup } from './zodSchemas/schemas.js';

// Only allow one instance of the app
if (!app.requestSingleInstanceLock()) {
	log.info('Another instance of the app is already running, quitting this one.');
	app.quit();
}

export function getAutoUpdater(): AppUpdater {
	// Using destructuring to access autoUpdater due to the CommonJS module of 'electron-updater'.
	// It is a workaround for ESM compatibility issues, see https://github.com/electron-userland/electron-builder/issues/7976.
	const { autoUpdater } = electronUpdater;
	return autoUpdater;
}

getAutoUpdater().logger = log;
//@ts-ignore
getAutoUpdater().logger.transports.file.level = 'info';
log.info('App starting...');

// Basically remove the scale factor people use on windows - we only need to scale font size
// not the whole window, so this stops padding etc from taking up the whole screen.
app.commandLine.appendSwitch('high-dpi-support', '1');
app.commandLine.appendSwitch('force-device-scale-factor', '1');

app.whenReady().then(async () => {
	await objectFactory.getMigrationService().MigrateOnStartup();

	setTimeout(
		createWindow,
		process.platform === 'linux' ? 1000 : 0 // https://github.com/electron/electron/issues/16809
	);

	// Auto updates
	getAutoUpdater().checkForUpdatesAndNotify();
});

// Check for update on startup
getAutoUpdater().on('update-available', (message) => {
	log.info('Checked for update, received:', message);
});

async function createWindow() {
	// Set up the tray
	const trayImage = nativeImage.createFromPath(getDesktopIconPath());
	if (trayImage.isEmpty()) log.info('Tray image failed to load, tray icon will not display!');

	const tray = new Tray(trayImage);
	tray.setToolTip(`Path Of Levelling 2 v${app.getVersion()}`);
	tray.setContextMenu(
		Menu.buildFromTemplate([
			{
				label: 'Quit',
				click: () => {
					app.quit();
				}
			},
			{
				label: 'Switch To PoE1',
				click: () => {
					objectFactory.switchProfile("poe1");
				}
			},
			{
				label: 'Switch To PoE2',
				click: () => {
					objectFactory.switchProfile("poe2");
				}
			},
		])
	);

	// Set up main window
	const mainWindow = new BrowserWindow({
		...OVERLAY_WINDOW_OPTS,
		icon: trayImage,
		webPreferences: {
			preload: path.join(getPreloadPath()),
		},
	});

	if (isDev()) {
		mainWindow.loadURL('http://localhost:5123');
		mainWindow.webContents.openDevTools({ mode: 'detach', activate: false });
	} else {
		mainWindow.loadFile(path.join(getUIPath()));
	}

	log.info('Attaching to window:', getProfile().windowName);
	OverlayController.attachByTitle(
		mainWindow,
		getProfile().windowName
	);

	// This basically runs the loop of read lines, save state, post state to renderer,
	// rinse and repeat.
	objectFactory.getLogWatcherService().watchClientTxt(mainWindow);

	createIPCEventListeners(mainWindow, objectFactory.getLogWatcherService());

	registerGlobalHotkeys(mainWindow);

	OverlayController.events.addListener('focus', async () => {
		// When the overlay gains focus, if the user had settings open (i.e. window
		// is interactable), the overlay will be recreated WITHOUT interaction.
		// So, we sleep to wait for window to be created then enable interaction.
		await new Promise(f => setTimeout(f, 100));
		mainWindow.setIgnoreMouseEvents(!objectFactory.getStateTracker().settingsOpen);
	});

	// Uh still unfamiliar with this package so just logging all events
	if (isDev()) LogOverlayEventCalls(mainWindow);
}

function createIPCEventListeners(mainWindow: BrowserWindow, logWatcher: LogWatcherService) {
	ipcMain.handle('getFontScalingFactor', async (event) => {
		const { width, height } = screen.getPrimaryDisplay().workAreaSize;
		return height / 1080; // return a scaling factor to scale up text with resolution
	});

	// Handle events from the General Settings overlay
	ipcMain.handle('getClientPath', async (event) => {
		return objectFactory.getSettingsService().getClientTxtPath();
	});

	ipcMain.handle('saveClientPath', async (event, clientTxtPath: string) => {
		var result = objectFactory.getSettingsService().saveClientTxtPath(clientTxtPath, mainWindow, logWatcher);
		return result;
	});

	ipcMain.handle('getIsClientWatcherActive', async (event) => {
		return objectFactory.getStateTracker().getIsClientWatcherActive();
	});

	// Handle events from the Zone Tracker
	ipcMain.handle('getZoneState', async (event, args) => {
		mainWindow.webContents.send(
			'zoneLayoutImageUpdates',
			objectFactory.getZoneTracker().zoneImageFilePaths
		);
		return objectFactory.getZoneTracker();
	});

	ipcMain.handle('postActSelected', async (event, actSelected: string) => {
		objectFactory.getZoneTracker().saveZoneFromActName(actSelected);
		mainWindow.webContents.send(
			'zoneLayoutImageUpdates',
			objectFactory.getZoneTracker().zoneImageFilePaths
		);
		return objectFactory.getZoneTracker();
	});

	ipcMain.handle(
		'postZoneSelected',
		async (event, zoneSelected: string, actSelected: string) => {
			objectFactory.getZoneTracker().saveZoneFromZoneNameAndActName(
				zoneSelected,
				actSelected
			);
			mainWindow.webContents.send(
				'zoneLayoutImageUpdates',
				objectFactory.getZoneTracker().zoneImageFilePaths
			);
			return objectFactory.getZoneTracker();
		}
	);

	ipcMain.handle('getLayoutImagePaths', async (event, args) => {
		return objectFactory.getZoneTracker().zoneImageFilePaths;
	});

	// Handle events from the level tracker
	ipcMain.handle('getLevelState', async (event, args) => {
		return objectFactory.getLevelTracker();
	});

	// Handle events from the gem tracker
	ipcMain.handle('getGemState', async (event, args) => {
		return {
			allGemSetupLevels: objectFactory.getGemTracker().allGemSetupLevels,
			selectedLevel: objectFactory.getGemTracker().gemSetup.level,
			gemLinks: objectFactory.getGemTracker().gemSetup.gemLinks
		};
	});

	ipcMain.handle('postGemLevelSelected', async (event, gemLevelSelected: number) => {
		objectFactory.getGemTracker().setGemSetupFromPlayerLevel(gemLevelSelected);
		return {
			allGemSetupLevels: objectFactory.getGemTracker().allGemSetupLevels,
			selectedLevel: objectFactory.getGemTracker().gemSetup.level,
			gemLinks: objectFactory.getGemTracker().gemSetup.gemLinks
		};
	});

	// Handle events from the gem SETTINGS
	ipcMain.handle('getGemSettingsState', async (event, args) => {
		return {
			buildName: objectFactory.getGemTracker().buildName,
			allBuildNames: objectFactory.getGemTracker().allBuildNames,
			allGemSetupLevels: objectFactory.getGemTracker().allGemSetupLevels,
			allGemSetups: objectFactory.getGemTracker().allGemSetups,
		};
	});

	ipcMain.handle('postBuildSelected', async (event, buildName: string) => {
		objectFactory.getSettingsService().saveBuildName(buildName);
		objectFactory.getGemTracker().loadGemSetup(buildName);
		objectFactory.getGemTracker().setGemSetupFromPlayerLevel(objectFactory.getLevelTracker().playerLevel);

		// Send the updated state to the Gem Tracker component
		mainWindow.webContents.send(
			'subscribeToGemUpdates',
			{
				allGemSetupLevels: objectFactory.getGemTracker().allGemSetupLevels,
				selectedLevel: objectFactory.getGemTracker().gemSetup.level,
				gemLinks: objectFactory.getGemTracker().gemSetup.gemLinks
			}
		);

		// Return the updated state to Gem Tracker Settings component
		return {
			buildName: objectFactory.getGemTracker().buildName,
			allBuildNames: objectFactory.getGemTracker().allBuildNames,
			allGemSetupLevels: objectFactory.getGemTracker().allGemSetupLevels,
			allGemSetups: objectFactory.getGemTracker().allGemSetups,
		};
	});

	ipcMain.handle('postAddNewBuild', async (event, buildName: string) => {
		// Set the current build
		objectFactory.getSettingsService().saveBuildName(buildName);

		// Save the new build & load it
		objectFactory.getGemTracker().saveNewBuild(buildName);
		objectFactory.getGemTracker().loadGemSetup(buildName);
		objectFactory.getGemTracker().setGemSetupFromPlayerLevel(objectFactory.getLevelTracker().playerLevel);


		// Send the updated state to the Gem Tracker component
		mainWindow.webContents.send(
			'subscribeToGemUpdates',
			{
				allGemSetupLevels: objectFactory.getGemTracker().allGemSetupLevels,
				selectedLevel: objectFactory.getGemTracker().gemSetup.level,
				gemLinks: objectFactory.getGemTracker().gemSetup.gemLinks
			}
		);

		// Return the updated state to Gem Tracker Settings component
		return {
			buildName: objectFactory.getGemTracker().buildName,
			allBuildNames: objectFactory.getGemTracker().allBuildNames,
			allGemSetupLevels: objectFactory.getGemTracker().allGemSetupLevels,
			allGemSetups: objectFactory.getGemTracker().allGemSetups,
		};
	});

	ipcMain.handle('postDeleteBuild', async (event, buildName: string) => {
		// Set to default
		objectFactory.getSettingsService().saveBuildName('Default');

		// Delete the build & load Default
		objectFactory.getGemTracker().deleteBuild(buildName);
		objectFactory.getGemTracker().loadGemSetup('Default');
		objectFactory.getGemTracker().setGemSetupFromPlayerLevel(objectFactory.getLevelTracker().playerLevel);


		// Send the updated state to the Gem Tracker component
		mainWindow.webContents.send(
			'subscribeToGemUpdates',
			{
				allGemSetupLevels: objectFactory.getGemTracker().allGemSetupLevels,
				selectedLevel: objectFactory.getGemTracker().gemSetup.level,
				gemLinks: objectFactory.getGemTracker().gemSetup.gemLinks
			}
		);

		// Return the updated state to Gem Tracker Settings component
		return {
			buildName: objectFactory.getGemTracker().buildName,
			allBuildNames: objectFactory.getGemTracker().allBuildNames,
			allGemSetupLevels: objectFactory.getGemTracker().allGemSetupLevels,
			allGemSetups: objectFactory.getGemTracker().allGemSetups,
		};
	});

	ipcMain.handle('saveGemSetupsForBuild', async (event, response: { buildName: string, allGemSetups: GemSetup[] }) => {
		// Set the current build
		objectFactory.getSettingsService().saveBuildName(response.buildName);

		// Save the new build
		objectFactory.getGemTracker().saveGemBuild(response.buildName, response.allGemSetups);
		objectFactory.getGemTracker().loadGemSetup(response.buildName);
		objectFactory.getGemTracker().setGemSetupFromPlayerLevel(objectFactory.getLevelTracker().playerLevel);

		// Send the updated state to the Gem Tracker component
		mainWindow.webContents.send(
			'subscribeToGemUpdates',
			{
				allGemSetupLevels: objectFactory.getGemTracker().allGemSetupLevels,
				selectedLevel: objectFactory.getGemTracker().gemSetup.level,
				gemLinks: objectFactory.getGemTracker().gemSetup.gemLinks
			}
		);

		// Return the updated state to Gem Tracker Settings component		
		return {
			buildName: objectFactory.getGemTracker().buildName,
			allBuildNames: objectFactory.getGemTracker().allBuildNames,
			allGemSetupLevels: objectFactory.getGemTracker().allGemSetupLevels,
			allGemSetups: objectFactory.getGemTracker().allGemSetups,
		};
	});

	// Handle UI window position events
	ipcMain.handle('getSettingsOverlayPositionSettings', async (event, args) => {
		return objectFactory.getSettingsService().getSettingsOverlayPositionSettings();
	});

	ipcMain.handle(
		'saveSettingsOverlayPositionSettings',
		async (event, settingsOverlaySettings) => {
			objectFactory.getSettingsService().saveSettingsOverlayPositionSettings(settingsOverlaySettings);
		}
	);

	ipcMain.handle('getZoneOverlayPositionSettings', async (event, args) => {
		return objectFactory.getSettingsService().getZoneOverlayPositionSettings();
	});

	ipcMain.handle('saveZoneOverlayPositionSettings', async (event, zoneSettings) => {
		objectFactory.getSettingsService().saveZoneOverlayPositionSettings(zoneSettings);
	});

	ipcMain.handle('getLayoutImagesOverlayPositionSettings', async (event, args) => {
		return objectFactory.getSettingsService().getLayoutImagesOverlayPositionSettings();
	});

	ipcMain.handle(
		'saveLayoutImagesOverlayPositionSettings',
		async (event, layoutImageSettings) => {
			objectFactory.getSettingsService().saveLayoutImagesOverlayPositionSettings(layoutImageSettings);
		}
	);

	ipcMain.handle('getLevelOverlayPositionSettings', async (event, args) => {
		return objectFactory.getSettingsService().getLevelOverlayPositionSettings();
	});

	ipcMain.handle('saveLevelOverlayPositionSettings', async (event, levelSettings) => {
		objectFactory.getSettingsService().saveLevelOverlayPositionSettings(levelSettings);
	});

	ipcMain.handle('getGemOverlayPositionSettings', async (event, args) => {
		return objectFactory.getSettingsService().getGemOverlayPositionSettings();
	});

	ipcMain.handle('saveGemOverlayPositionSettings', async (event, gemSettings) => {
		objectFactory.getSettingsService().saveGemOverlayPositionSettings(gemSettings);
	});
}

function registerGlobalHotkeys(mainWindow: BrowserWindow) {
	//Show/hide settings - default hidden
	globalShortcut.register('Ctrl+Alt+S', () => {
		objectFactory.getStateTracker().settingsOpen = !objectFactory.getStateTracker().settingsOpen;
		mainWindow.webContents.send('Hotkeys', {
			Hotkey: 'ToggleSettings',
			value: objectFactory.getStateTracker().settingsOpen,
		});
		// Enable clicks on overlay
		mainWindow.setIgnoreMouseEvents(!objectFactory.getStateTracker().settingsOpen);
	});
	//Show/hide zone notes - default shown
	globalShortcut.register('Ctrl+Alt+z', () => {
		objectFactory.getStateTracker().zoneNotesOpen = !objectFactory.getStateTracker().zoneNotesOpen;
		mainWindow.webContents.send('Hotkeys', {
			Hotkey: 'ToggleZoneNotes',
			value: objectFactory.getStateTracker().zoneNotesOpen,
		});
	});
	//Show/hide layout images - default shown
	globalShortcut.register('Ctrl+Alt+i', () => {
		objectFactory.getStateTracker().layoutImagesOpen = !objectFactory.getStateTracker().layoutImagesOpen;
		mainWindow.webContents.send('Hotkeys', {
			Hotkey: 'ToggleLayoutImages',
			value: objectFactory.getStateTracker().layoutImagesOpen,
		});
	});
	//Show/hide level tracker - default shown
	globalShortcut.register('Ctrl+Alt+l', () => {
		objectFactory.getStateTracker().levelTrackerOpen = !objectFactory.getStateTracker().levelTrackerOpen;
		mainWindow.webContents.send('Hotkeys', {
			Hotkey: 'ToggleLevelTracker',
			value: objectFactory.getStateTracker().levelTrackerOpen,
		});
	});
	//Show/hide level tracker - default shown
	globalShortcut.register('Ctrl+Alt+g', () => {
		objectFactory.getStateTracker().gemTrackerOpen = !objectFactory.getStateTracker().gemTrackerOpen;
		mainWindow.webContents.send('Hotkeys', {
			Hotkey: 'ToggleGemTracker',
			value: objectFactory.getStateTracker().gemTrackerOpen,
		});
	});
}

//-----------------------testing
function LogOverlayEventCalls(mainWindow: BrowserWindow) {
	// Still getting used to the events so uhhhhh just log when all of them are used.
	OverlayController.events.addListener('attach', (params) => {
		log.info('attach event emitted', params);
	});

	OverlayController.events.addListener('detach', () => {
		log.info('detach event emitted ');
	});

	OverlayController.events.addListener('fullscreen', () => {
		log.info('fullscreen event emitted');
	});

	OverlayController.events.addListener('moveresize', (params) => {
		log.info('moveresize event emitted ', params);
	});

	OverlayController.events.addListener('blur', (params) => {
		log.info('blur event emitted ', params);
	});

	OverlayController.events.addListener('focus', (params) => {
		log.info('focus event emitted ', params);
	});
}
