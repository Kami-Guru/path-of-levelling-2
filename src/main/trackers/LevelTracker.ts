import log from 'electron-log';
import { objectFactory } from '../objectFactory.js';
import { StoreService } from '../services/StoreService.js';
import { GemTracker } from './GemTracker.js';

export class LevelTracker {
	playerLevel: number;
	monsterLevel: number;
	expMulti: number;

	constructor(storeService: StoreService) {
		//TODO This crap was just put here to get rid of ts warning, verify this is all initialised
		//TODO and DELETE these, then //@ts-ignore the props
		this.playerLevel = 0;
		this.monsterLevel = 0;
		this.expMulti = 0;

		this.savePlayerOrMonsterLevel(
			storeService.getGameSetting('lastSessionState.playerLevel'),
			storeService.getGameSetting('lastSessionState.monsterLevel'),
			true
		);
	}

	init() {}

	// It's a huge pain to have a bunch of ifs all over the place to update monster and
	// player level separately, so I just made this method work whenever you need it to.
	// Just pass 0 or don't pass anything at all if you don't want to update one of them.
	savePlayerOrMonsterLevel(
		playerLevel: number = 0,
		monsterLevel: number = 0,
		updateOnly: boolean = false
	) {
		if (playerLevel == 0 && monsterLevel == 0) return;

		if (playerLevel > 0) this.playerLevel = playerLevel;
		if (monsterLevel > 0) this.monsterLevel = monsterLevel;

		this.recalculateEXPModifier();

		// There are a few reasons we want to update locally, but not save.
		// Biggest example is when the app is first starting up and loading from file,
		// don't need to immediately write to that file.
		if (!updateOnly) objectFactory.getStateTracker().saveSessionState();
	}

	recalculateEXPModifier() {
		log.info(
			'Recalculating EXP modifier with playerLevel',
			this.playerLevel,
			'monsterLevel',
			this.monsterLevel
		);
		var safeZone = Math.floor(3 + this.playerLevel / 16);

		// Don't want to modify this.monsterLevel so just make a placeholder
		var monsterLevel = this.monsterLevel;
		if ((monsterLevel == 71)) {
			monsterLevel = 70.94;
		} else if ((monsterLevel == 72)) {
			monsterLevel = 71.82;
		} else if ((monsterLevel == 73)) {
			monsterLevel = 72.64;
		} else if ((monsterLevel == 74)) {
			monsterLevel = 73.4;
		} else if ((monsterLevel == 75)) {
			monsterLevel = 74.1;
		} else if ((monsterLevel == 76)) {
			monsterLevel = 74.74;
		} else if ((monsterLevel == 77)) {
			monsterLevel = 75.32;
		} else if ((monsterLevel == 78)) {
			monsterLevel = 75.84;
		} else if ((monsterLevel == 79)) {
			monsterLevel = 76.3;
		} else if ((monsterLevel == 80)) {
			monsterLevel = 76.7;
		} else if ((monsterLevel == 81)) {
			monsterLevel = 77.04;
		} else if ((monsterLevel == 82)) {
			monsterLevel = 77.32;
		} else if ((monsterLevel == 83)) {
			monsterLevel = 77.54;
		} else if ((monsterLevel == 84)) {
			monsterLevel = 77.7;
		}

		var effectiveDifference = Math.abs(this.playerLevel - monsterLevel) - safeZone;

		if (effectiveDifference < 0) {
			this.expMulti = 1;
			return;
		}

		var expMulti = Math.sqrt(
			((this.playerLevel + 5) /
				(this.playerLevel + 5 + Math.sqrt(effectiveDifference ** 5))) ** 3
		);

		if (this.playerLevel >= 95) {
			expMulti = expMulti * (1 / (1 + 0.1 * (this.playerLevel - 94)));
		}

		if (expMulti < 0.01) {
			expMulti = 0.01;
		}

		this.expMulti = (Math.round(expMulti * 100) / 100);
	}
}
