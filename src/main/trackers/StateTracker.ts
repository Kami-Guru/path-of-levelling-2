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

	savedStatePath: string;
	zoneNotesPath: string;
	gemSetupPath: string;

	settingsOpen: boolean = false;
	zoneNotesOpen: boolean = true;
	layoutImagesOpen: boolean = true;
	levelTrackerOpen: boolean = true;
	gemNotesOpen: boolean = false; // TODO make true once this is implemented

	logWatcherActive: boolean = false;

	constructor() {
		// need to read some level of state from here. probably have to write it into the
		// builds folder? maybe need a state tracker that just tracks the build
		// get zone notes path
		this.store = new Store();

		this.ZoneTracker = new ZoneTracker();
		this.LevelTracker = new LevelTracker();
		this.GemTracker = new GemTracker();

		this.savedStatePath = ''; //this just gets rid of the warning
		this.zoneNotesPath = '';
		this.gemSetupPath = '';

		if (settings.getBuildFolder() == null) {
			return;
		}

		this.savedStatePath = path.join(
			getBuildPath(settings.getBuildFolder()),
			'savedState.json'
		);
		this.zoneNotesPath = path.join(
			getBuildPath(settings.getBuildFolder()),
			'zoneNotes.json'
		);
		this.gemSetupPath = path.join(
			getBuildPath(settings.getBuildFolder()),
			'gemSetup.json'
		);

		try {
			log.info('Loading notes from path', this.zoneNotesPath);
			this.ZoneTracker.loadAllZoneNotes(this.zoneNotesPath);
			this.ZoneTracker.saveZoneFromCode(
				this.store.get('lastSessionState.zoneCode') as string,
				true
			);

			this.LevelTracker.savePlayerOrMonsterLevel(
				this.store.get('lastSessionState.playerLevel') as number,
				this.store.get('lastSessionState.monsterLevel') as number,
				true
			);

			this.GemTracker.loadGemSetups(this.gemSetupPath);
			this.GemTracker.saveGemSetupFromPlayerLevel(
				this.store.get('lastSessionState.playerLevel') as number
			);
		} catch (error) {
			//TODO: Do I even need to do anything here? This feature is not important
			log.info('Could not load saved state, with error:');
			log.info(error);
		}
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
