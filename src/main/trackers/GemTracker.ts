import log from 'electron-log';
import { objectFactory } from '../objectFactory.js';
import { SettingsService } from '../services/Settings.js';
import { LevelTracker } from './LevelTracker.js';
import { Build, GemBuild, GemSetup } from '../zodSchemas/schemas.js';
import { GemDataDto, GemSettingsDto } from '../ipc/apiInterface.js';

// TODO: GemTracker owns builds cuz I haven't added any build stuff to anything else.
export class GemTracker {
	//TODO: move this when I have a Build class or something better than this
	buildName: string = "Default";
	allBuildNames: string[] = ["Default"];
	gemBuild: GemBuild = Object();

	// Current setup - shown in the UI
	gemSetup: GemSetup = Object();
	allGemSetups: GemSetup[] = Object();
	allGemSetupLevels: number[] = [0];

	constructor(settingsService: SettingsService, levelTracker: LevelTracker) {
		this.loadGemSetup(settingsService.getBuildName())
		this.setGemSetupFromPlayerLevel(levelTracker.playerLevel);
	}

	init() { }

	getGemDataDto(): GemDataDto {
		return {
			allGemSetupLevels: this.allGemSetupLevels,
			gemSetupLevel: this.gemSetup.level,
			gemLinks: this.gemSetup.gemLinks
		}
	}

	getGemSettingsDto(): GemSettingsDto {
		return {
			buildName: this.buildName,
			allBuildNames: this.allBuildNames,
			allGemSetupLevels: this.allGemSetupLevels,
			allGemSetups: this.allGemSetups,
		};
	}

	//TODO Seriously I need to get all this build stuff out of gem tracker
	saveNewBuild(newBuildName: string) {
		log.info('Saving new build:', newBuildName);

		if (objectFactory.getStoreService().getBuild(newBuildName)) {
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

		objectFactory.getStoreService().setBuild(newBuildName, newBuild);
	}

	deleteBuild(buildName: string) {
		log.info('Deleting build:', buildName);

		if (!objectFactory.getStoreService().getBuild(buildName)) {
			log.warn('Build does not exist, not deleting:', buildName);
			return;
		}

		objectFactory.getStoreService().deleteBuild(buildName);
	}

	loadGemSetup(buildName: string) {
		log.info('Trying to load gem setups');

		//TODO this should go in a real Build class or whatever
		this.buildName = buildName;
		this.allBuildNames = objectFactory.getStoreService().getAllBuildNames();

		var build = objectFactory.getStoreService().getBuild(buildName);

		if (!build) {
			log.warn('Could not load gem setup, build does not exist: ' + buildName)
			log.warn('Loading default gem setup')
			build = objectFactory.getStoreService().getBuild('Default')!;
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

		objectFactory.getStoreService().setBuild(buildName, {
			...objectFactory.getStoreService().getBuild(buildName) ?? { buildName: buildName },
			gemBuild: newGemBuild
		});
	}
}