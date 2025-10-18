import { BrowserWindow } from 'electron';
import { LogWatcherService } from './LogWatcherService.js';
import { OverlayPosition, UiSettings } from '../zodSchemas/schemas.js';
import { objectFactory } from '../objectFactory.js';

export class SettingsService {

	constructor() { }

	init() {}

	getClientTxtPath(): string {
		return objectFactory.getStoreService().getGameSetting('clientTxtPath') as string;
	}

	saveClientTxtPath(
		newPath: string,
		mainWindow: BrowserWindow,
		logWatcher: LogWatcherService
	): boolean {
		objectFactory.getStoreService().setGameSetting('clientTxtPath', newPath);

		// Attempt to subscribe to the log watcher again.
		//TODO there is a case here when someone has a valid path, changes it, then their
		//TODO app still works until they log in next time. IDK what to do about that
		if (!objectFactory.getStateTracker().logWatcherActive) {
			logWatcher.watchClientTxt(mainWindow);
		}

		//Return the result
		return objectFactory.getStateTracker().logWatcherActive;
	}

	getBuildName(): string {
		return objectFactory.getStoreService().getGameSetting('buildName') as string;
	}

	saveBuildName(buildName: string) {
		objectFactory.getStoreService().setGameSetting('buildName', buildName);
	}

	getSettingsOverlayPositionSettings(): OverlayPosition {
		return objectFactory.getStoreService().getGameSetting('uiSettings').settingsOverlayPosition;
	}

	saveSettingsOverlayPositionSettings(newSettings: OverlayPosition) {
		objectFactory.getStoreService().setGameSetting('uiSettings.settingsOverlayPosition', newSettings);
	}

	getZoneOverlayPositionSettings(): OverlayPosition {
		return objectFactory.getStoreService().getGameSetting('uiSettings.zoneTrackerPosition');
	}

	saveZoneOverlayPositionSettings(newSettings: OverlayPosition) {
		objectFactory.getStoreService().setGameSetting('uiSettings.zoneTrackerPosition', newSettings);
	}

	getLayoutImagesOverlayPositionSettings(): OverlayPosition {
		return objectFactory.getStoreService().getGameSetting('uiSettings.layoutImagesTrackerPosition');
	}

	saveLayoutImagesOverlayPositionSettings(newSettings: OverlayPosition) {
		objectFactory.getStoreService().setGameSetting('uiSettings.layoutImagesTrackerPosition', newSettings);
	}

	getLevelOverlayPositionSettings(): OverlayPosition {
		return objectFactory.getStoreService().getGameSetting('uiSettings.levelTrackerPosition');
	}

	saveLevelOverlayPositionSettings(newSettings: OverlayPosition) {
		objectFactory.getStoreService().setGameSetting('uiSettings.levelTrackerPosition', newSettings);
	}

	getGemOverlayPositionSettings(): OverlayPosition {
		return objectFactory.getStoreService().getGameSetting('uiSettings.gemTrackerPosition');
	}

	saveGemOverlayPositionSettings(newSettings: OverlayPosition) {
		objectFactory.getStoreService().setGameSetting('uiSettings.gemTrackerPosition', newSettings);
	}
}
