const electron = require("electron");
//this is cts so that it compiles into the only cjs file and electron can find it
//idk man i got it from the internet

electron.contextBridge.exposeInMainWorld("electron", {
	// Settings
	subscribeToHotkeys: (callback) => {
		return electron.ipcRenderer.on("Hotkeys", (event: any, args: any) => {
			callback(args);
		});
	},
	getIsClientWatcherActive: async () => electron.ipcRenderer.invoke("getIsClientWatcherActive"),
	getClientPath: async () => electron.ipcRenderer.invoke("getClientPath"),
	saveClientPath: async (clientTxtPath: string) =>
		electron.ipcRenderer.invoke("saveClientPath", clientTxtPath),

	// Position Settings
	getFontScalingFactor: async () => electron.ipcRenderer.invoke("getFontScalingFactor"),
	getSettingsOverlayPositionSettings: async () =>
		electron.ipcRenderer.invoke("getSettingsOverlayPositionSettings"),
	saveSettingsOverlayPositionSettings: async (settingsOverlaySettings) =>
		electron.ipcRenderer.invoke("saveSettingsOverlayPositionSettings", settingsOverlaySettings),

	getZoneOverlayPositionSettings: async () =>
		electron.ipcRenderer.invoke("getZoneOverlayPositionSettings"),
	saveZoneOverlayPositionSettings: async (zoneSettings) =>
		electron.ipcRenderer.invoke("saveZoneOverlayPositionSettings", zoneSettings),

	getLayoutImagesOverlayPositionSettings: async () =>
		electron.ipcRenderer.invoke("getLayoutImagesOverlayPositionSettings"),
	saveLayoutImagesOverlayPositionSettings: async (layoutImagesSettings) =>
		electron.ipcRenderer.invoke(
			"saveLayoutImagesOverlayPositionSettings",
			layoutImagesSettings
		),

	getLevelOverlayPositionSettings: async () =>
		electron.ipcRenderer.invoke("getLevelOverlayPositionSettings"),
	saveLevelOverlayPositionSettings: async (levelSettings) =>
		electron.ipcRenderer.invoke("saveLevelOverlayPositionSettings", levelSettings),

	getGemOverlayPositionSettings: async () =>
		electron.ipcRenderer.invoke("getGemOverlayPositionSettings"),
	saveGemOverlayPositionSettings: async (gemSettings) =>
		electron.ipcRenderer.invoke("saveGemOverlayPositionSettings", gemSettings),

	// Methods for the zone tracker
	subscribeToZoneNotesUpdates: (callback) => {
		return electron.ipcRenderer.on("zoneUpdatesFromLog", (event: any, args: any) => {
			callback(args);
		});
	},
	getZoneState: async () => electron.ipcRenderer.invoke("getZoneState"),
	postActSelected: async (actSelected: string) =>
		electron.ipcRenderer.invoke("postActSelected", actSelected),
	postZoneSelected: async (zoneSelectedRequest) =>
		electron.ipcRenderer.invoke(
			"postZoneSelected",
			zoneSelectedRequest
		),

	subscribeToZoneLayoutImageUpdates: (callback: any) => {
		return electron.ipcRenderer.on("zoneLayoutImageUpdates", (event: any, args: any) => {
			callback(args);
		});
	},
	getLayoutImagePaths: async () => electron.ipcRenderer.invoke("getLayoutImagePaths"),

	// Methods for the level tracker
	subscribeToLevelUpdates: (callback: any) => {
		return electron.ipcRenderer.on("subscribeToLevelUpdates", (event: any, args: any) => {
			callback(args);
		});
	},
	getLevelState: async () => electron.ipcRenderer.invoke("getLevelState"),

	// Methods for the gem TRACKER
	subscribeToGemUpdates: (callback: any) => {
		return electron.ipcRenderer.on("subscribeToGemUpdates", (event: any, args: any) => {
			callback(args);
		});
	},
	getGemState: async () => electron.ipcRenderer.invoke("getGemState"),
	postGemLevelSelected: async (gemLevelSelected: number) =>
		electron.ipcRenderer.invoke("postGemLevelSelected", gemLevelSelected),

	// Methods for the gem SETTINGS
	getGemSettingsState: async () => electron.ipcRenderer.invoke("getGemSettingsState"),
	postBuildSelected: async (buildName: string) =>
		electron.ipcRenderer.invoke("postBuildSelected", buildName),
	postAddNewBuild: async (buildName: string) =>
		electron.ipcRenderer.invoke("postAddNewBuild", buildName),
	postDeleteBuild: async (buildName: string) =>
		electron.ipcRenderer.invoke("postDeleteBuild", buildName),
	saveGemSetupsForBuild: async (response: any) =>
		electron.ipcRenderer.invoke("saveGemSetupsForBuild", response),
} satisfies Window["electron"]);
