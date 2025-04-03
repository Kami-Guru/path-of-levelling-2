import fs from 'fs';

export class GemTracker {
	allGemSetups: GemSetup[];
	gemSetupPath: string;

	// Current setup - shown in the UI
	allGemSetupLevels: number[];
	gemSetup: GemSetup;

	constructor() {
		this.allGemSetupLevels = [0];
		this.allGemSetups = Object();
		this.gemSetupPath = '';

		// Current setup
		this.gemSetup = Object();
	}

	// Load gem setups from file.
	loadGemSetups(gemSetupPath: string) {
		console.log('Trying to get gem setups');
		this.gemSetupPath = gemSetupPath;

		try {
			var buffer = fs.readFileSync(this.gemSetupPath);
			this.allGemSetups = JSON.parse(buffer.toString()).setups;

			// This is used to populate the dropdown in the UI
			this.allGemSetupLevels = this.allGemSetups.map((setup: GemSetup) => {
				return setup.level;
			});

			console.log('Successfully loaded gem setups');
		} catch (error) {
			console.log('Could not load gem setups');
		}
	}

	// Returns bool representing if gem setup was actually changed
	// (to say if we should post state to renderer basically)
	saveGemSetupFromPlayerLevel(playerLevel: number): Boolean {
		var gemSetupChanged: Boolean = this.setGemSetupFromPlayerLevel(playerLevel);

		if (!gemSetupChanged) return false;

		return true;
	}

	setGemSetupFromPlayerLevel(playerLevel: number): Boolean {
		var foundGemSetup = this.allGemSetups.findLast((gemSetup) => {
			return playerLevel >= gemSetup.level;
		});

		if (foundGemSetup == null) {
			console.log('Could not find gem setup matching level', playerLevel);
			return false;
		}
		if (foundGemSetup == this.gemSetup) {
			console.log('Gem setup found, but same as existing. No changes made.');
			return false;
		}

		this.gemSetup = foundGemSetup;
		return true;
	}
}

type GemSetupJSON = {};

type GemSetup = {
	level: number;
	gemLinks: GemLink[];
	gemSources: GemSource[];
};

type GemLink = {
	linkedGemString: string;
};

type GemSource = {
	gemSourceString: string;
};
