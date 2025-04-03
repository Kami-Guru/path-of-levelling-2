import fs from 'fs';
import path from 'path';
import { getBuildPath } from '../pathResolver.js';
import { GemTracker } from './GemTracker.js';
import { LevelTracker } from './LevelTracker.js';
import { ZoneTracker } from './ZoneTracker.js';
import log from 'electron-log';

// Class to basically track state that shows in the front end, eg the current zone,
// current player/monster level, current gem setup, etc.
export class StateTracker {
	ZoneTracker: ZoneTracker;
	LevelTracker: LevelTracker;
	GemTracker: GemTracker;

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
			// try to read the saved state
			var buffer = fs.readFileSync(this.savedStatePath);
			var savedState = JSON.parse(buffer.toString());

			log.info('Loading notes from path', this.zoneNotesPath);
			this.ZoneTracker.loadAllZoneNotes(this.zoneNotesPath);
			this.ZoneTracker.saveZoneFromCode(savedState.zoneCode, true);

			this.LevelTracker.savePlayerOrMonsterLevel(
				savedState.playerLevel,
				savedState.monsterLevel,
				true
			);

			this.GemTracker.loadGemSetups(this.gemSetupPath);
			this.GemTracker.saveGemSetupFromPlayerLevel(savedState.playerLevel);
		} catch (error) {
			//TODO: Do I even need to do anything here? This feature is not important
			log.info('Could not load saved state, with error:');
			log.info(error);
		}
	}

	writeStateToFile() {
		// Needs: {zoneCode, playerLevel, monsterLevel}
		var zoneCode = this.ZoneTracker.zoneCode;
		var playerLevel = this.LevelTracker.playerLevel;
		var monsterLevel = this.LevelTracker.monsterLevel;

		var stateToSave = { zoneCode, playerLevel, monsterLevel };
		fs.writeFileSync(this.savedStatePath, JSON.stringify(stateToSave));
	}

	getIsClientWatcherActive(): Boolean {
		return this.logWatcherActive;
	}
}
