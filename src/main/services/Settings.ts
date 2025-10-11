import { BrowserWindow } from 'electron';
import { LogWatcherService } from './LogWatcherService.js';
import { OverlayPosition, UiSettings } from '../zodSchemas/schemas.js';

export class Settings {

	constructor() {}

	getClientTxtPath(): string {
		return storeService.getGameSetting('clientTxtPath') as string;
	}

	saveClientTxtPath(
		newPath: string,
		mainWindow: BrowserWindow,
		logWatcher: LogWatcherService
	): boolean {
		storeService.setGameSetting('clientTxtPath', newPath);

		// Attempt to subscribe to the log watcher again.
		//TODO there is a case here when someone has a valid path, changes it, then their
		//TODO app still works until they log in next time. IDK what to do about that
		if (!mainState.logWatcherActive) {
			logWatcher.watchClientTxt(mainWindow);
		}

		//Return the result
		return mainState.logWatcherActive;
	}

	getBuildName(): string {
		return storeService.getGameSetting('buildName') as string;
	}

	saveBuildName(buildName: string) {
		storeService.setGameSetting('buildName', buildName);
	}

	getSettingsOverlayPositionSettings(): OverlayPosition {
		return storeService.getGameSetting('uiSettings').settingsOverlayPosition;
	}

	saveSettingsOverlayPositionSettings(newSettings: OverlayPosition) {
		storeService.setGameSetting('uiSettings.settingsOverlayPosition', newSettings);
	}

	getZoneOverlayPositionSettings(): OverlayPosition {
		return storeService.getGameSetting('uiSettings.zoneTrackerPosition');
	}

	saveZoneOverlayPositionSettings(newSettings: OverlayPosition) {
		storeService.setGameSetting('uiSettings.zoneTrackerPosition', newSettings);
	}

	getLayoutImagesOverlayPositionSettings(): OverlayPosition {
		return storeService.getGameSetting('uiSettings.layoutImagesTrackerPosition');
	}

	saveLayoutImagesOverlayPositionSettings(newSettings: OverlayPosition) {
		storeService.setGameSetting('uiSettings.layoutImagesTrackerPosition', newSettings);
	}

	getLevelOverlayPositionSettings(): OverlayPosition {
		return storeService.getGameSetting('uiSettings.levelTrackerPosition');
	}

	saveLevelOverlayPositionSettings(newSettings: OverlayPosition) {
		storeService.setGameSetting('uiSettings.levelTrackerPosition', newSettings);
	}

	getGemOverlayPositionSettings(): OverlayPosition {
		return storeService.getGameSetting('uiSettings.gemTrackerPosition');
	}

	saveGemOverlayPositionSettings(newSettings: OverlayPosition) {
		storeService.setGameSetting('uiSettings.gemTrackerPosition', newSettings);
	}
}
