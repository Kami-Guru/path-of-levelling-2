// Have to register all of these types globally so that I can use them in preload.cts
// I tried many things and this was the only way :(

/** Mapping from channel name to return type sent from Main->Renderer */
type channelReturnTypeMapping = {
	// --- SETTINGS --- //
	// Position Settings
	getSettingsOverlayPositionSettings: OverlayPosition;
	saveSettingsOverlayPositionSettings: void;
	getZoneOverlayPositionSettings: OverlayPosition;
	saveZoneOverlayPositionSettings: void;
	getLayoutImagesOverlayPositionSettings: OverlayPosition;
	saveLayoutImagesOverlayPositionSettings: void;
	getLevelOverlayPositionSettings: OverlayPosition;
	saveLevelOverlayPositionSettings: void;
	getGemOverlayPositionSettings: OverlayPosition;
	saveGemOverlayPositionSettings: void;

	getFontScalingFactor: number;
	getClientPath: string;
	saveClientPath: boolean;
	getIsClientWatcherActive: boolean;

	Hotkeys: HotkeyEvent;

	// Gem Settings
	getGemSettingsState: GemSettingsDto;
	postBuildSelected: GemSettingsDto;
	postAddNewBuild: GemSettingsDto;
	postDeleteBuild: GemSettingsDto;
	saveGemSetupsForBuild: GemSettingsDto;

	// --- TRACKERS --- //
	// Zone Tracker
	zoneUpdatesFromLog: ZoneDataDto;
	getZoneState: ZoneDataDto;
	postActSelected: ZoneDataDto;
	postZoneSelected: ZoneDataDto;

	zoneLayoutImageUpdates: string[];
	getLayoutImagePaths: string[];

	// Level Tracker
	subscribeToLevelUpdates: LevelDataDto;
	getLevelState: LevelDataDto;

	// Gem Tracker
	subscribeToGemUpdates: GemDataDto;
	getGemState: GemDataDto;
	postGemLevelSelected: GemDataDto;
};

/** Mapping from channel name to request type sent from Renderer->Main */
type channelRequestTypeMapping = {
	// --- SETTINGS --- //
	// Position Settings
	saveSettingsOverlayPositionSettings: OverlayPosition;
	saveZoneOverlayPositionSettings: OverlayPosition;
	saveLayoutImagesOverlayPositionSettings: OverlayPosition;
	saveLevelOverlayPositionSettings: OverlayPosition;
	saveGemOverlayPositionSettings: OverlayPosition;

	saveClientPath: string;

	postBuildSelected: string;
	postAddNewBuild: string;
	postDeleteBuild: string;
	saveGemSetupsForBuild: SaveGemSetupsRequest;

	// --- TRACKERS --- //
	// Zone Tracker
	postZoneSelected: ZoneSelectedRequest;
	postActSelected: string;

	// Gem Tracker
	postGemLevelSelected: number;
};

// --- Settings --- //
type HotkeyEvent = {
	hotkey:
		| "ToggleSettings"
		| "ToggleZoneNotes"
		| "ToggleLayoutImages"
		| "ToggleLevelTracker"
		| "ToggleGemTracker";
	value: boolean;
};

type SaveGemSetupsRequest = {
	buildName: string;
	allGemSetups: GemSetup[];
};

type GemSettingsDto = {
	buildName: string;
	allBuildNames: string[];
	allGemSetupLevels: number[];
	allGemSetups: GemSetup[];
};

// --- Trackers --- //
type ZoneSelectedRequest = {
	zoneSelected: string;
	actSelected: string;
};

type ZoneDataDto = {
	act: string;
	zone: string;
	zoneCode: string;
	allActs: string[];
	allZonesInAct: string[];
	actNotes: string;
	zoneNotes: string;
};

type LevelDataDto = {
	playerLevel: number;
	monsterLevel: number;
	expMulti: number;
};

type GemDataDto = {
	allGemSetupLevels: number[];
	gemSetupLevel: number;
	gemLinks: string[];
};