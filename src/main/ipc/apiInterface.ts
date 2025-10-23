// Extend the 'Window' interface to include all the methods that we put in preload.cts,

import { OverlayPosition } from "../zodSchemas/schemas.js";

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