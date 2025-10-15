import { objectFactory } from '../objectFactory.js';

// Class to basically track state that shows in the front end, eg the current zone,
// current player/monster level, current gem setup, etc.
export class StateTracker {
	settingsOpen: boolean = false;
	zoneNotesOpen: boolean = true;
	layoutImagesOpen: boolean = true;
	levelTrackerOpen: boolean = true;
	gemTrackerOpen: boolean = true;

	logWatcherActive: boolean = false;

	constructor() { }

	init() {}

	saveSessionState() {
		objectFactory.getStoreService().setGameSetting('lastSessionState',
			{
				zoneCode: objectFactory.getZoneTracker().zoneCode,
				playerLevel: objectFactory.getLevelTracker().playerLevel,
				monsterLevel: objectFactory.getLevelTracker().monsterLevel
			}
		)
	}

	getIsClientWatcherActive(): Boolean {
		return this.logWatcherActive;
	}
}
