// Extend the 'Window' interface to include all the methods that we put in preload.cts,

import { GemSetup, OverlayPosition } from "../zodSchemas/schemas.js";

// so that in react land we can write 'window.electron.someMethod' with type safety.
declare global {
	interface Window {
		electron: {
			// --- SETTINGS --- //
			subscribeToHotkeys: (callback: (hotkeyEvent: HotkeyEvent) => void) => void;
			getFontScalingFactor: () => Promise<number>;

			// Client.txt tracking
			getIsClientWatcherActive: () => Promise<boolean>;
			getClientPath: () => Promise<string>;
			saveClientPath: (clientTxtPath: string) => Promise<boolean>;

			// Gem Settings
			getGemSettingsState: () => Promise<GemSettingsDto>;
			postBuildSelected: (buildName: string) => Promise<GemSettingsDto>;
			postAddNewBuild: (buildName: string) => Promise<GemSettingsDto>;
			postDeleteBuild: (buildName: string) => Promise<GemSettingsDto>;
			saveGemSetupsForBuild: (
				saveGemSetupsDto: SaveGemSetupsRequest
			) => Promise<GemSettingsDto>;

			// Position Settings
			getSettingsOverlayPositionSettings: () => Promise<OverlayPosition>;
			saveSettingsOverlayPositionSettings: (overlayPosition: OverlayPosition) => void;
			getZoneOverlayPositionSettings: () => Promise<OverlayPosition>;
			saveZoneOverlayPositionSettings: (overlayPosition: OverlayPosition) => void;
			getLayoutImagesOverlayPositionSettings: () => Promise<OverlayPosition>;
			saveLayoutImagesOverlayPositionSettings: (overlayPosition: OverlayPosition) => void;
			getLevelOverlayPositionSettings: () => Promise<OverlayPosition>;
			saveLevelOverlayPositionSettings: (overlayPosition: OverlayPosition) => void;
			getGemOverlayPositionSettings: () => Promise<OverlayPosition>;
			saveGemOverlayPositionSettings: (overlayPosition: OverlayPosition) => void;

			/// --- TRACKERS --- //
			// Zone Tracker
			subscribeToZoneNotesUpdates: (callback: (zoneDataDto: ZoneDataDto) => void) => void;
			getZoneState: () => Promise<ZoneDataDto>;
			postActSelected: (actSelected: string) => Promise<ZoneDataDto>;
			postZoneSelected: (zoneSelectedRequest: ZoneSelectedRequest) => Promise<ZoneDataDto>;

			subscribeToZoneLayoutImageUpdates: (callback: (paths: string[]) => void) => void;
			getLayoutImagePaths: () => Promise<string[]>;

			// Level Tracker
			subscribeToLevelUpdates: (callback: (levelDataDto: LevelDataDto) => void) => void;
			getLevelState: () => Promise<LevelDataDto>;

			// Gem Tracker
			subscribeToGemUpdates: (callback: (gemDataDto: GemDataDto) => void) => void;
			getGemState: () => Promise<GemDataDto>;
			postGemLevelSelected: (gemLevelSelected: number) => Promise<GemDataDto>;
		};
	}
}

export type HotkeyEvent = {
	hotkey:
		| "ToggleSettings"
		| "ToggleZoneNotes"
		| "ToggleLayoutImages"
		| "ToggleLevelTracker"
		| "ToggleGemTracker";
	value: boolean;
};

/** Mapping from channel name to return type sent from Main->Renderer */
export type channelReturnTypeMapping = {
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
export type channelRequestTypeMapping = {
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

// settings
export type SaveGemSetupsRequest = {
	buildName: string;
	allGemSetups: GemSetup[];
};

export type GemSettingsDto = {
	buildName: string;
	allBuildNames: string[];
	allGemSetupLevels: number[];
	allGemSetups: GemSetup[];
};

// trackers
export type ZoneSelectedRequest = {
	zoneSelected: string;
	actSelected: string;
};

export type ZoneDataDto = {
	act: string;
	zone: string;
	zoneCode: string;
	allActs: string[];
	allZonesInAct: string[];
	actNotes: string;
	zoneNotes: string;
};

export type LevelDataDto = {
	playerLevel: number;
	monsterLevel: number;
	expMulti: number;
};

export type GemDataDto = {
	allGemSetupLevels: number[];
	gemSetupLevel: number;
	gemLinks: string[];
};
