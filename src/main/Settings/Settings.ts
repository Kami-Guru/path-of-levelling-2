import { BrowserWindow } from 'electron';
import Store from 'electron-store';
import path from 'path';
import { LogWatcher } from '../LogWatcher.js';
import { guessClientTxtPath } from '../pathResolver.js';
import defaultSettings from './defaultSettings.json' with { type: "json" };

export class Settings {
	store: Store;

	constructor() {
		this.store = new Store();
	}

	async fillMissingSettingsWithDefaults() {
		// Ensure that the settings store doesn't return undefined everywhere by
		// copying from a default settings.
		// !Keep the default settings updated!

		// TODO Yes yes this is terrible I'll do it recursively later
		var test = this.store.get('clientTxtPath');
		if (!this.store.get('clientTxtPath')) {
			this.store.set('clientTxtPath', await guessClientTxtPath());
		}

		if (!this.store.get('buildName')) {
			this.store.set('buildName', defaultSettings.buildName);
		}

		// Previously 'buildName' was 'buildFolder', so do a migration here
		if (this.store.get('buildFolder')) {
			this.store.set('buildName', this.store.get('buildFolder'));
			this.store.delete('buildFolder');
		}

		// Get last session state
		if (!this.store.get('lastSessionState.zoneCode')) {
			this.store.set(
				'lastSessionState.zoneCode',
				defaultSettings.lastSessionState.zoneCode
			);
		}
		if (!this.store.get('lastSessionState.playerLevel')) {
			this.store.set(
				'lastSessionState.playerLevel',
				defaultSettings.lastSessionState.playerLevel
			);
		}
		if (!this.store.get('lastSessionState.monsterLevel')) {
			this.store.set(
				'lastSessionState.monsterLevel',
				defaultSettings.lastSessionState.monsterLevel
			);
		}

		// Get UI positions
		if (!this.store.get('uiSettings.settingsOverlayPosition')) {
			this.store.set(
				'uiSettings.settingsOverlayPosition',
				defaultSettings.uiSettings.settingsOverlayPosition
			);
		}
		if (!this.store.get('uiSettings.zoneTrackerPosition')) {
			this.store.set(
				'uiSettings.zoneTrackerPosition',
				defaultSettings.uiSettings.zoneTrackerPosition
			);
		}
		if (!this.store.get('uiSettings.layoutImagesTrackerPosition')) {
			this.store.set(
				'uiSettings.layoutImagesTrackerPosition',
				defaultSettings.uiSettings.layoutImagesTrackerPosition
			);
		}
		if (!this.store.get('uiSettings.levelTrackerPosition')) {
			this.store.set(
				'uiSettings.levelTrackerPosition',
				defaultSettings.uiSettings.levelTrackerPosition
			);
		}
		if (!this.store.get('uiSettings.gemTrackerPosition')) {
			this.store.set(
				'uiSettings.gemTrackerPosition',
				defaultSettings.uiSettings.gemTrackerPosition
			);
		}
	}

	getClientTxtPath(): string {
		return this.store.get('clientTxtPath') as string;
	}

	saveClientTxtPath(
		newPath: string,
		mainWindow: BrowserWindow,
		logWatcher: LogWatcher
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
		console.log('Saving build name', buildName);
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
