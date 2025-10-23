/// <reference path="./apiTypes.d.ts" />
const electron = require("electron");

// Need to write some ipc wrappers here cuz can't import them
// The Window interface gives type safety in Renderer; channelReturnTypeMapping and
// channelRequestTypeMapping gives type safety in Main, these ipcWrappers throw errors when the
// type mappings and the Window interface don't line up. This ensures the type hints on either side
// actually match each other

/** Type safe wrapper for get requests from Renderer->Main */
function ipcRendererInvokeGet<K extends keyof channelReturnTypeMapping>(
	channel: K
): Promise<channelReturnTypeMapping[K]> {
	return electron.ipcRenderer.invoke(channel as string);
}

/** Type safe wrapper for get requests from Renderer->Main which expect a response */
function ipcRendererInvokePost<K extends keyof channelReturnTypeMapping>(
	channel: K,
	request: K extends keyof channelRequestTypeMapping ? channelRequestTypeMapping[K] : undefined
): Promise<channelReturnTypeMapping[K]> {
	return electron.ipcRenderer.invoke(channel as string, request as any);
}

/** Type safe wrapper for Renderer->Main subscriptions */
function ipcRendererOn<K extends keyof channelReturnTypeMapping>(
	channel: K,
	callback: (event: any, payload: channelReturnTypeMapping[K]) => void
) {
	return electron.ipcRenderer.on(channel as string, (event: any, args: any) => {
		callback(event, args);
	});
}

electron.contextBridge.exposeInMainWorld("electron", {
	// Settings
	subscribeToHotkeys: (callback) => {
		return ipcRendererOn("Hotkeys", (_, args: HotkeyEvent) => {
			callback(args);
		});
	},
	getIsClientWatcherActive: async () => ipcRendererInvokeGet("getIsClientWatcherActive"),
	getClientPath: async () => ipcRendererInvokeGet("getClientPath"),
	saveClientPath: async (clientTxtPath: string) =>
		ipcRendererInvokePost("saveClientPath", clientTxtPath),

	// Position Settings
	getFontScalingFactor: async () => ipcRendererInvokeGet("getFontScalingFactor"),
	getSettingsOverlayPositionSettings: async () =>
		ipcRendererInvokeGet("getSettingsOverlayPositionSettings"),
	saveSettingsOverlayPositionSettings: async (settingsOverlaySettings) =>
		ipcRendererInvokePost("saveSettingsOverlayPositionSettings", settingsOverlaySettings),

	getZoneOverlayPositionSettings: async () =>
		ipcRendererInvokeGet("getZoneOverlayPositionSettings"),
	saveZoneOverlayPositionSettings: async (zoneSettings) =>
		ipcRendererInvokePost("saveZoneOverlayPositionSettings", zoneSettings),

	getLayoutImagesOverlayPositionSettings: async () =>
		ipcRendererInvokeGet("getLayoutImagesOverlayPositionSettings"),
	saveLayoutImagesOverlayPositionSettings: async (layoutImagesSettings) =>
		ipcRendererInvokePost("saveLayoutImagesOverlayPositionSettings", layoutImagesSettings),

	getLevelOverlayPositionSettings: async () =>
		ipcRendererInvokeGet("getLevelOverlayPositionSettings"),
	saveLevelOverlayPositionSettings: async (levelSettings) =>
		ipcRendererInvokePost("saveLevelOverlayPositionSettings", levelSettings),

	getGemOverlayPositionSettings: async () =>
		ipcRendererInvokeGet("getGemOverlayPositionSettings"),
	saveGemOverlayPositionSettings: async (gemSettings) =>
		ipcRendererInvokePost("saveGemOverlayPositionSettings", gemSettings),

	// Methods for the zone tracker
	subscribeToZoneNotesUpdates: (callback) => {
		return ipcRendererOn("zoneUpdatesFromLog", (_, args) => {
			callback(args);
		});
	},
	getZoneState: async () => ipcRendererInvokeGet("getZoneState"),
	postActSelected: async (actSelected: string) =>
		ipcRendererInvokePost("postActSelected", actSelected),
	postZoneSelected: async (zoneSelectedRequest) =>
		ipcRendererInvokePost("postZoneSelected", zoneSelectedRequest),

	subscribeToZoneLayoutImageUpdates: (callback) => {
		return ipcRendererOn("zoneLayoutImageUpdates", (_, args) => {
			callback(args);
		});
	},
	getLayoutImagePaths: async () => ipcRendererInvokeGet("getLayoutImagePaths"),

	// Methods for the level tracker
	subscribeToLevelUpdates: (callback) => {
		return ipcRendererOn("subscribeToLevelUpdates", (_, args) => {
			callback(args);
		});
	},
	getLevelState: async () => ipcRendererInvokeGet("getLevelState"),

	// Methods for the gem TRACKER
	subscribeToGemUpdates: (callback) => {
		return ipcRendererOn("subscribeToGemUpdates", (_, args) => {
			callback(args);
		});
	},
	getGemState: async () => ipcRendererInvokeGet("getGemState"),
	postGemLevelSelected: async (gemLevelSelected) =>
		ipcRendererInvokePost("postGemLevelSelected", gemLevelSelected),

	// Methods for the gem SETTINGS
	getGemSettingsState: async () => ipcRendererInvokeGet("getGemSettingsState"),
	postBuildSelected: async (buildName) =>
		ipcRendererInvokePost("postBuildSelected", buildName),
	postAddNewBuild: async (buildName) => ipcRendererInvokePost("postAddNewBuild", buildName),
	postDeleteBuild: async (buildName) => ipcRendererInvokePost("postDeleteBuild", buildName),
	saveGemSetupsForBuild: async (response) =>
		ipcRendererInvokePost("saveGemSetupsForBuild", response),
} satisfies Window["electron"]);
