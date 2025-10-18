import {
	app,
	BrowserWindow,
	globalShortcut,
	shell,
	Menu,
	screen,
	Tray,
	nativeImage,
} from "electron";
import log from "electron-log";
import { OVERLAY_WINDOW_OPTS, OverlayController } from "electron-overlay-window";
import electronUpdater, { type AppUpdater } from "electron-updater";
import path from "path";
import { LogWatcherService } from "./services/LogWatcherService.js";
import { getDesktopIconPath, getPreloadPath, getUIPath, isDev } from "./pathResolver.js";
import { objectFactory } from "./objectFactory.js";
import { getProfile } from "./profiles/profiles.js";
import { GemSetup } from "./zodSchemas/schemas.js";
import { ipcMainHandle, ipcWebContentsSend } from "./ipc/ipcWrappers.js";
import { GemDataDto } from "./ipc/apiInterface.js";

// Only allow one instance of the app
if (!app.requestSingleInstanceLock()) {
	log.info("Another instance of the app is already running, quitting this one.");
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
getAutoUpdater().logger.transports.file.level = "info";
log.info("App starting...");

// Basically remove the scale factor people use on windows - we only need to scale font size
// not the whole window, so this stops padding etc from taking up the whole screen.
app.commandLine.appendSwitch("high-dpi-support", "1");
app.commandLine.appendSwitch("force-device-scale-factor", "1");

app.whenReady().then(async () => {
	await objectFactory.getMigrationService().MigrateOnStartup();

	setTimeout(
		createWindow,
		process.platform === "linux" ? 1000 : 0 // https://github.com/electron/electron/issues/16809
	);

	// Auto updates
	getAutoUpdater().checkForUpdatesAndNotify();
});

// Check for update on startup
getAutoUpdater().on("update-available", (message) => {
	log.info("Checked for update, received:", message);
});

async function createWindow() {
	// Set up the tray
	const trayImage = nativeImage.createFromPath(getDesktopIconPath());
	if (trayImage.isEmpty()) log.info("Tray image failed to load, tray icon will not display!");

	const tray = new Tray(trayImage);
	tray.setToolTip(`Path Of Levelling 2 v${app.getVersion()}`);
	tray.setContextMenu(
		Menu.buildFromTemplate([
			{
				label: "Quit",
				click: () => {
					app.quit();
				},
			},
			{
				label: "Switch To PoE1",
				click: () => {
					objectFactory.switchProfile("poe1");
				},
			},
			{
				label: "Switch To PoE2",
				click: () => {
					objectFactory.switchProfile("poe2");
				},
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

	// Prevent opening new windows within the app - open in browser instead
	// eg. links to documentation
	mainWindow.webContents.on("will-navigate", (event, url) => {
		// Check if the URL is outside our app
		const currentHost = new URL(mainWindow.webContents.getURL()).host;
		const requestedHost = new URL(url).host;

		if (requestedHost && requestedHost !== currentHost) {
			event.preventDefault(); // Prevent default navigation within the app
			shell.openExternal(url); // Open in external browser
		}
	});

	if (isDev()) {
		mainWindow.loadURL("http://localhost:5123");
		mainWindow.webContents.openDevTools({ mode: "detach", activate: false });
	} else {
		mainWindow.loadFile(path.join(getUIPath()));
	}

	log.info("Attaching to window:", getProfile().windowName);
	OverlayController.attachByTitle(mainWindow, getProfile().windowName);

	// This basically runs the loop of read lines, save state, post state to renderer,
	// rinse and repeat.
	objectFactory.getLogWatcherService().watchClientTxt(mainWindow);

	createIPCEventListeners(mainWindow, objectFactory.getLogWatcherService());

	registerGlobalHotkeys(mainWindow);

	OverlayController.events.addListener("focus", async () => {
		// When the overlay gains focus, if the user had settings open (i.e. window
		// is interactable), the overlay will be recreated WITHOUT interaction.
		// So, we sleep to wait for window to be created then enable interaction.
		await new Promise((f) => setTimeout(f, 100));
		mainWindow.setIgnoreMouseEvents(!objectFactory.getStateTracker().settingsOpen);
	});

	// Uh still unfamiliar with this package so just logging all events
	if (isDev()) LogOverlayEventCalls(mainWindow);
}

function createIPCEventListeners(mainWindow: BrowserWindow, logWatcher: LogWatcherService) {
	ipcMainHandle("getFontScalingFactor", async (_) => {
		const { width, height } = screen.getPrimaryDisplay().workAreaSize;
		return height / 1080; // return a scaling factor to scale up text with resolution
	});

	// Handle events from the General Settings overlay
	ipcMainHandle("getClientPath", async (_) => {
		return objectFactory.getSettingsService().getClientTxtPath();
	});

	ipcMainHandle("saveClientPath", async (_, clientTxtPath) => {
		var result = objectFactory
			.getSettingsService()
			.saveClientTxtPath(clientTxtPath, mainWindow, logWatcher);
		return result;
	});

	ipcMainHandle("getIsClientWatcherActive", async (_) => {
		return objectFactory.getStateTracker().getIsClientWatcherActive();
	});

	// Handle events from the Zone Tracker
	ipcMainHandle("getZoneState", async (_, args) => {
		ipcWebContentsSend(
			"zoneLayoutImageUpdates",
			mainWindow.webContents,
			objectFactory.getZoneTracker().zoneImageFilePaths
		);

		return objectFactory.getZoneTracker().getZoneDataDto();
	});

	ipcMainHandle("postActSelected", async (_, actSelected) => {
		objectFactory.getZoneTracker().saveZoneFromActName(actSelected);
		ipcWebContentsSend(
			"zoneLayoutImageUpdates",
			mainWindow.webContents,
			objectFactory.getZoneTracker().zoneImageFilePaths
		);
		return objectFactory.getZoneTracker().getZoneDataDto();
	});

	ipcMainHandle("postZoneSelected", async (event, zoneSelectedRequest) => {
		console.log("Updating zone from zoneSelectedRequest:", zoneSelectedRequest);
		// Update zone based on zone and act selected
		objectFactory
			.getZoneTracker()
			.saveZoneFromZoneNameAndActName(
				zoneSelectedRequest.zoneSelected,
				zoneSelectedRequest.actSelected
			);

		// Send updated layout images
		ipcWebContentsSend(
			"zoneLayoutImageUpdates",
			mainWindow.webContents,
			objectFactory.getZoneTracker().zoneImageFilePaths
		);

		// Return updated zone data
		return objectFactory.getZoneTracker().getZoneDataDto();
	});

	ipcMainHandle("getLayoutImagePaths", async (_) => {
		return objectFactory.getZoneTracker().zoneImageFilePaths;
	});

	// Handle events from the level tracker
	ipcMainHandle("getLevelState", async (_, args) => {
		return objectFactory.getLevelTracker().getLevelDataDto();
	});

	// Handle events from the gem tracker
	ipcMainHandle("getGemState", async (_) => {
		return objectFactory.getGemTracker().getGemDataDto();
	});

	ipcMainHandle("postGemLevelSelected", async (_, gemLevelSelected) => {
		objectFactory.getGemTracker().setGemSetupFromPlayerLevel(gemLevelSelected);
		return objectFactory.getGemTracker().getGemDataDto();
	});

	// Handle events from the gem SETTINGS
	ipcMainHandle("getGemSettingsState", async (_, args) => {
		return objectFactory.getGemTracker().getGemSettingsDto();
	});

	ipcMainHandle("postBuildSelected", async (_, buildName) => {
		objectFactory.getSettingsService().saveBuildName(buildName);
		objectFactory.getGemTracker().loadGemSetup(buildName);
		objectFactory
			.getGemTracker()
			.setGemSetupFromPlayerLevel(objectFactory.getLevelTracker().playerLevel);

		// Send the updated state to the Gem Tracker component
		ipcWebContentsSend(
			"subscribeToGemUpdates",
			mainWindow.webContents,
			objectFactory.getGemTracker().getGemDataDto()
		);

		// Return the updated state to Gem Tracker Settings component
		return objectFactory.getGemTracker().getGemSettingsDto();
	});

	ipcMainHandle("postAddNewBuild", async (_, buildName) => {
		// Set the current build
		objectFactory.getSettingsService().saveBuildName(buildName);

		// Save the new build & load it
		objectFactory.getGemTracker().saveNewBuild(buildName);
		objectFactory.getGemTracker().loadGemSetup(buildName);
		objectFactory
			.getGemTracker()
			.setGemSetupFromPlayerLevel(objectFactory.getLevelTracker().playerLevel);

		// Send the updated state to the Gem Tracker component
		ipcWebContentsSend(
			"subscribeToGemUpdates",
			mainWindow.webContents,
			objectFactory.getGemTracker().getGemDataDto()
		);

		// Return the updated state to Gem Tracker Settings component
		return objectFactory.getGemTracker().getGemSettingsDto();
	});

	ipcMainHandle("postDeleteBuild", async (_, buildName) => {
		// Set to default
		objectFactory.getSettingsService().saveBuildName("Default");

		// Delete the build & load Default
		objectFactory.getGemTracker().deleteBuild(buildName);
		objectFactory.getGemTracker().loadGemSetup("Default");
		objectFactory
			.getGemTracker()
			.setGemSetupFromPlayerLevel(objectFactory.getLevelTracker().playerLevel);

		// Send the updated state to the Gem Tracker component
		ipcWebContentsSend(
			"subscribeToGemUpdates",
			mainWindow.webContents,
			objectFactory.getGemTracker().getGemDataDto()
		);

		// Return the updated state to Gem Tracker Settings component
		return objectFactory.getGemTracker().getGemSettingsDto();
	});

	ipcMainHandle("saveGemSetupsForBuild", async (_, request) => {
		// Set the current build
		objectFactory.getSettingsService().saveBuildName(request.buildName);

		// Save the new build
		objectFactory.getGemTracker().saveGemBuild(request.buildName, request.allGemSetups);
		objectFactory.getGemTracker().loadGemSetup(request.buildName);
		objectFactory
			.getGemTracker()
			.setGemSetupFromPlayerLevel(objectFactory.getLevelTracker().playerLevel);

		// Send the updated state to the Gem Tracker component
		ipcWebContentsSend(
			"subscribeToGemUpdates",
			mainWindow.webContents,
			objectFactory.getGemTracker().getGemDataDto()
		);

		// Return the updated state to Gem Tracker Settings component
		return objectFactory.getGemTracker().getGemSettingsDto();
	});

	// Handle UI window position events
	ipcMainHandle("getSettingsOverlayPositionSettings", async (_, args) => {
		return objectFactory.getSettingsService().getSettingsOverlayPositionSettings();
	});

	ipcMainHandle("saveSettingsOverlayPositionSettings", async (event, settingsOverlaySettings) => {
		objectFactory
			.getSettingsService()
			.saveSettingsOverlayPositionSettings(settingsOverlaySettings);
	});

	ipcMainHandle("getZoneOverlayPositionSettings", async (_, args) => {
		return objectFactory.getSettingsService().getZoneOverlayPositionSettings();
	});

	ipcMainHandle("saveZoneOverlayPositionSettings", async (_, zoneSettings) => {
		objectFactory.getSettingsService().saveZoneOverlayPositionSettings(zoneSettings);
	});

	ipcMainHandle("getLayoutImagesOverlayPositionSettings", async (_, args) => {
		return objectFactory.getSettingsService().getLayoutImagesOverlayPositionSettings();
	});

	ipcMainHandle("saveLayoutImagesOverlayPositionSettings", async (event, layoutImageSettings) => {
		objectFactory
			.getSettingsService()
			.saveLayoutImagesOverlayPositionSettings(layoutImageSettings);
	});

	ipcMainHandle("getLevelOverlayPositionSettings", async (_, args) => {
		return objectFactory.getSettingsService().getLevelOverlayPositionSettings();
	});

	ipcMainHandle("saveLevelOverlayPositionSettings", async (_, levelSettings) => {
		objectFactory.getSettingsService().saveLevelOverlayPositionSettings(levelSettings);
	});

	ipcMainHandle("getGemOverlayPositionSettings", async (_, args) => {
		return objectFactory.getSettingsService().getGemOverlayPositionSettings();
	});

	ipcMainHandle("saveGemOverlayPositionSettings", async (_, gemSettings) => {
		objectFactory.getSettingsService().saveGemOverlayPositionSettings(gemSettings);
	});
}

function registerGlobalHotkeys(mainWindow: BrowserWindow) {
	//Show/hide settings - default hidden
	globalShortcut.register("Ctrl+Alt+S", () => {
		objectFactory.getStateTracker().settingsOpen =
			!objectFactory.getStateTracker().settingsOpen;

		ipcWebContentsSend("Hotkeys", mainWindow.webContents, {
			hotkey: "ToggleSettings",
			value: objectFactory.getStateTracker().settingsOpen,
		});

		// Enable clicks on overlay
		mainWindow.setIgnoreMouseEvents(!objectFactory.getStateTracker().settingsOpen);
	});
	//Show/hide zone notes - default shown
	globalShortcut.register("Ctrl+Alt+z", () => {
		objectFactory.getStateTracker().zoneNotesOpen =
			!objectFactory.getStateTracker().zoneNotesOpen;

		ipcWebContentsSend("Hotkeys", mainWindow.webContents, {
			hotkey: "ToggleZoneNotes",
			value: objectFactory.getStateTracker().zoneNotesOpen,
		});
	});
	//Show/hide layout images - default shown
	globalShortcut.register("Ctrl+Alt+i", () => {
		objectFactory.getStateTracker().layoutImagesOpen =
			!objectFactory.getStateTracker().layoutImagesOpen;

		ipcWebContentsSend("Hotkeys", mainWindow.webContents, {
			hotkey: "ToggleLayoutImages",
			value: objectFactory.getStateTracker().layoutImagesOpen,
		});
	});
	//Show/hide level tracker - default shown
	globalShortcut.register("Ctrl+Alt+l", () => {
		objectFactory.getStateTracker().levelTrackerOpen =
			!objectFactory.getStateTracker().levelTrackerOpen;

		ipcWebContentsSend("Hotkeys", mainWindow.webContents, {
			hotkey: "ToggleLevelTracker",
			value: objectFactory.getStateTracker().levelTrackerOpen,
		});
	});
	//Show/hide level tracker - default shown
	globalShortcut.register("Ctrl+Alt+g", () => {
		objectFactory.getStateTracker().gemTrackerOpen =
			!objectFactory.getStateTracker().gemTrackerOpen;

		ipcWebContentsSend("Hotkeys", mainWindow.webContents, {
			hotkey: "ToggleGemTracker",
			value: objectFactory.getStateTracker().gemTrackerOpen,
		});
	});
}

//-----------------------testing
function LogOverlayEventCalls(mainWindow: BrowserWindow) {
	// Still getting used to the events so uhhhhh just log when all of them are used.
	OverlayController.events.addListener("attach", (params) => {
		log.info("attach event emitted", params);
	});

	OverlayController.events.addListener("detach", () => {
		log.info("detach event emitted ");
	});

	OverlayController.events.addListener("fullscreen", () => {
		log.info("fullscreen event emitted");
	});

	OverlayController.events.addListener("moveresize", (params) => {
		log.info("moveresize event emitted ", params);
	});

	OverlayController.events.addListener("blur", (params) => {
		log.info("blur event emitted ", params);
	});

	OverlayController.events.addListener("focus", (params) => {
		log.info("focus event emitted ", params);
	});
}
