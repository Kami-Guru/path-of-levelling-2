import fs from 'fs';
import log from 'electron-log';
import Store from 'electron-store';
import path from 'path';
import { getBuildsRootPath } from '../pathResolver.js';

// TODO: GemTracker owns builds cuz I haven't added any build stuff to anything else.
export class GemTracker {
	store: Store;

	//TODO: move this when I have a Build class or something better than this
	buildName: string;
	allBuildNames: string[]
	gemBuild: GemBuild;

	// Current setup - shown in the UI
	gemSetup: GemSetup;
	allGemSetups: GemSetup[];
	allGemSetupLevels: number[];

	constructor() {
		this.store = new Store({ name: "builds", accessPropertiesByDotNotation: false });

		this.buildName = '';
		this.allBuildNames = [];
		this.gemBuild = Object();

		this.allGemSetupLevels = [0];
		this.allGemSetups = Object();

		// Current setup
		this.gemSetup = Object();
	}

	// Crawls the src/main/Builds folder for default builds, and if the user does not have it in their
	// builds.json Store, add it there.
	async fillMissingBuildsWithDefaults() {
		const buildsDir = getBuildsRootPath();
		const buildFolders = fs.readdirSync(buildsDir, { withFileTypes: true })
			.filter(dirent => dirent.isDirectory()
				&& dirent.name !== "template")
			.map(dirent => dirent.name);

		for (const folder of buildFolders) {
			const buildPath = path.join(buildsDir, folder, 'build.json');
			if (!fs.existsSync(buildPath)) continue;

			const buildData = JSON.parse(fs.readFileSync(buildPath, 'utf-8'));
			const buildName = buildData.buildName;
			if (!this.store.get(buildName)) {
				this.store.set(buildName, buildData);
			}
		}
	}

	//TODO Seriously I need to get all this build stuff out of gem tracker
	saveNewBuild(newBuildName: string) {
		log.info('Saving new build:', newBuildName);

		if (this.store.get(newBuildName)) {
			log.warn('Build already exists, not saving:', newBuildName);
			return;
		}

		const newBuild: Build = {
			buildName: newBuildName,
			gemBuild: {
				changedByUser: true,
				gemSetups: [
					{
						level: 1,
						gemLinks: [],
						gemSources: []
					}
				]
			}
		};

		this.store.set(newBuildName, newBuild);
	}

	deleteBuild(buildName: string) {
		log.info('Deleting build:', buildName);

		if (!this.store.get(buildName)) {
			log.warn('Build does not exist, not deleting:', buildName);
			return;
		}

		this.store.delete(buildName);
	}

	loadGemSetup(buildName: string) {
		log.info('Trying to load gem setups');

		//TODO this should go in a real Build class or whatever
		this.buildName = buildName;
		this.allBuildNames = Object.keys(this.store.store);

		var build = this.store.get(buildName) as Build;

		if (!build) {
			log.warn('Could not load gem setup, build does not exist: ' + buildName)
			log.warn('Loading default gem setup')
			var build = this.store.get('Default') as Build;
		}

		this.gemBuild = build.gemBuild
		this.allGemSetups = build.gemBuild.gemSetups;

		// This is used to populate the dropdown in the UI
		this.allGemSetupLevels = this.allGemSetups.map((setup: GemSetup) => {
			return setup.level;
		});

		log.info('Successfully loaded gem setups');
	}

	// Returns bool representing if gem setup was actually changed
	// (to say if we should post state to renderer basically)
	setGemSetupFromPlayerLevel(playerLevel: number): Boolean {
		var foundGemSetup = this.allGemSetups.findLast((gemSetup) => {
			return playerLevel >= gemSetup.level;
		});

		if (foundGemSetup == null) {
			log.info('Could not find gem setup matching level', playerLevel);
			return false;
		}
		if (foundGemSetup == this.gemSetup) {
			log.info('Gem setup found, but same as existing. No changes made.');
			return false;
		}

		this.gemSetup = foundGemSetup;
		return true;
	}

	saveGemBuild(buildName: string, gemSetups: GemSetup[]) {
		log.info('Saving gem setups for build:', buildName);
		log.info(gemSetups);

		const newGemBuild = {
			changedByUser: true,
			gemSetups: gemSetups
		};

		this.store.set(buildName, {
			...this.store.get(buildName) as Build,
			gemBuild: newGemBuild
		});
	}
}

export type Build = {
	buildName: string;
	gemBuild: GemBuild;
}

export type GemBuild = {
	changedByUser: boolean;
	gemSetups: GemSetup[];
}

export type GemSetup = {
	level: number;
	gemLinks: string[];
	gemSources: string[];
};