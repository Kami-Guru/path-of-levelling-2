import { BrowserWindow } from 'electron';
import Store from 'electron-store';
import path from 'path';
import { LogWatcherService } from './LogWatcherService.js';
import { guessClientTxtPath } from '../pathResolver.js';
import defaultSettings from '../profiles/poe2/Settings/defaultSettings.json' with { type: "json" };

export class Settings {
	store: Store;

	constructor() {
		this.store = new Store();
	}

	getClientTxtPath(): string {
		return this.store.get('clientTxtPath') as string;
	}

	saveClientTxtPath(
		newPath: string,
		mainWindow: BrowserWindow,
		logWatcher: LogWatcherService
	): boolean {
		this.store.set('clientTxtPath', newPath);

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
		return this.store.get('buildName') as string;
	}

	saveBuildName(buildName: string) {
		this.store.set('buildName', buildName);
	}

	getSettingsOverlayPositionSettings(): any {
		return this.store.get('uiSettings.settingsOverlayPosition');
	}

	saveSettingsOverlayPositionSettings(newSettings: any) {
		this.store.set('uiSettings.settingsOverlayPosition.x', newSettings.x);
		this.store.set('uiSettings.settingsOverlayPosition.y', newSettings.y);
		this.store.set('uiSettings.settingsOverlayPosition.height', newSettings.height);
		this.store.set('uiSettings.settingsOverlayPosition.width', newSettings.width);
	}

	getZoneOverlayPositionSettings(): any {
		return this.store.get('uiSettings.zoneTrackerPosition');
	}

	saveZoneOverlayPositionSettings(newSettings: any) {
		this.store.set('uiSettings.zoneTrackerPosition.x', newSettings.x);
		this.store.set('uiSettings.zoneTrackerPosition.y', newSettings.y);
		this.store.set('uiSettings.zoneTrackerPosition.height', newSettings.height);
		this.store.set('uiSettings.zoneTrackerPosition.width', newSettings.width);
	}

	getLayoutImagesOverlayPositionSettings(): any {
		return this.store.get('uiSettings.layoutImagesTrackerPosition');
	}

	saveLayoutImagesOverlayPositionSettings(newSettings: any) {
		this.store.set('uiSettings.layoutImagesTrackerPosition.x', newSettings.x);
		this.store.set('uiSettings.layoutImagesTrackerPosition.y', newSettings.y);
		this.store.set(
			'uiSettings.layoutImagesTrackerPosition.height',
			newSettings.height
		);
		this.store.set('uiSettings.layoutImagesTrackerPosition.width', newSettings.width);
	}

	getLevelOverlayPositionSettings(): any {
		return this.store.get('uiSettings.levelTrackerPosition');
	}

	saveLevelOverlayPositionSettings(newSettings: any) {
		this.store.set('uiSettings.levelTrackerPosition.x', newSettings.x);
		this.store.set('uiSettings.levelTrackerPosition.y', newSettings.y);
		this.store.set('uiSettings.levelTrackerPosition.height', newSettings.height);
		this.store.set('uiSettings.levelTrackerPosition.width', newSettings.width);
	}

	getGemOverlayPositionSettings(): any {
		return this.store.get('uiSettings.gemTrackerPosition');
	}

	saveGemOverlayPositionSettings(newSettings: any) {
		this.store.set('uiSettings.gemTrackerPosition.x', newSettings.x);
		this.store.set('uiSettings.gemTrackerPosition.y', newSettings.y);
		this.store.set('uiSettings.gemTrackerPosition.height', newSettings.height);
		this.store.set('uiSettings.gemTrackerPosition.width', newSettings.width);
	}
}
