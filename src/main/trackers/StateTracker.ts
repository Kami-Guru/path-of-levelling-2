import log from 'electron-log';
import Store from 'electron-store';
import fs from 'fs';
import path from 'path';
import { getBuildPath } from '../pathResolver.js';
import { GemTracker } from './GemTracker.js';
import { LevelTracker } from './LevelTracker.js';
import { ZoneTracker } from './ZoneTracker.js';

// Class to basically track state that shows in the front end, eg the current zone,
// current player/monster level, current gem setup, etc.
export class StateTracker {
	ZoneTracker: ZoneTracker;
	LevelTracker: LevelTracker;
	GemTracker: GemTracker;

	store: Store;

	settingsOpen: boolean = false;
	zoneNotesOpen: boolean = true;
	layoutImagesOpen: boolean = true;
	levelTrackerOpen: boolean = true;
	gemTrackerOpen: boolean = true;

	logWatcherActive: boolean = false;

	constructor() {
		// need to read some level of state from here. probably have to write it into the
		// builds folder? maybe need a state tracker that just tracks the build
		// Get zone notes path
		this.store = new Store();

		this.ZoneTracker = new ZoneTracker();
		this.LevelTracker = new LevelTracker();
		this.GemTracker = new GemTracker();
	}

	async oneTimeSetup() {
		// Read zone notes from file
		var zoneNotesPath = path.join(
			getBuildPath('Default'),
			'zoneNotes.json'
		);

		try {
			log.info('Loading notes from path', zoneNotesPath);
			this.ZoneTracker.loadAllZoneNotes(zoneNotesPath);
			this.ZoneTracker.saveZoneFromCode(
				this.store.get('lastSessionState.zoneCode') as string,
				true
			);

			this.LevelTracker.savePlayerOrMonsterLevel(
				this.store.get('lastSessionState.playerLevel') as number,
				this.store.get('lastSessionState.monsterLevel') as number,
				true
			);
		} catch (error) {
			log.info('Could not load saved state, with error:');
			log.info(error);
		}

		await this.GemTracker.fillMissingBuildsWithDefaults();
		this.GemTracker.loadGemSetup(settings.getBuildName())
		this.GemTracker.setGemSetupFromPlayerLevel(this.LevelTracker.playerLevel);
	}

	//TODO doing all in one go is a holdover from old architecture, I can do it one by
	//TODO one now
	writeStateToFile() {
		// Needs: {zoneCode, playerLevel, monsterLevel}
		this.store.set('lastSessionState.zoneCode', this.ZoneTracker.zoneCode);
		this.store.set('lastSessionState.playerLevel', this.LevelTracker.playerLevel);
		this.store.set('lastSessionState.monsterLevel', this.LevelTracker.monsterLevel);
	}

	getIsClientWatcherActive(): Boolean {
		return this.logWatcherActive;
	}
}
