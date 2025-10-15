import { BrowserWindow } from 'electron';
import log from 'electron-log';
import fs from 'fs';
import { objectFactory } from '../objectFactory.js';

export class LogWatcherService {
	newZoneRegex: RegExp;
	levelUpRegex: RegExp;
	watchedFilePath: string = '';
	previousFileSize: number;

	constructor() {
		this.newZoneRegex = RegExp('Generating level (.*) area "(.*)" with seed');
		this.levelUpRegex = RegExp('is now level (.*)');

		this.previousFileSize = 0;

		log.info("LogWatcherService constructed");
	}

	init() {
		log.info("LogWatcherService initialised");
	}

	// The fs.watchFile is the watcher that gets changes from client.txt
	watchClientTxt(mainWindow: BrowserWindow) {
		log.info('Trying to subscribe to Client.txt');
		const filePathGuess = objectFactory.getSettingsService().getClientTxtPath();

		try {
			this.previousFileSize = fs.statSync(filePathGuess).size;
		} catch (e: any) { // TODO shouldn't I just catch whatever error ENONET is separately?
			// This flag basically displays a warning on the UI telling the user to
			// update their client txt path.
			objectFactory.getStateTracker().logWatcherActive = false;

			if ((e.code = 'ENOENT')) {
				//@ts-ignore
				log.error(
					`Could not subscribe to client txt changes, wrong client path! ${filePathGuess}`,
				);
				return;
			}

			log.error(
				`Could not subscribe to client txt changes, unknown error for path: ${filePathGuess}`,
				e
			);
			return;
		}

		objectFactory.getStateTracker().logWatcherActive = true;
		this.watchedFilePath = filePathGuess;
		log.info('Successfully subscribed to Client.txt');

		fs.watchFile(this.watchedFilePath, (current, previous) => {
			var data = this.readNewLines(current, previous);

			if (data == null) {
				return;
			}

			var shouldUpdateZoneTracker = false;
			// handle new zone code
			if (data.zoneCode != '') {
				shouldUpdateZoneTracker = objectFactory.getZoneTracker().saveZoneFromCode(
					data.zoneCode
				);
			}

			var shouldUpdateLevelTracker;
			if (data.monsterLevel > 0 || data.playerLevel > 0) {
				shouldUpdateLevelTracker = true;
				objectFactory.getLevelTracker().savePlayerOrMonsterLevel(
					data.playerLevel,
					data.monsterLevel
				);
			}

			var shouldUpdateGemTracker;
			if (data.playerLevel > 0) {
				shouldUpdateGemTracker = true;
				objectFactory.getGemTracker().setGemSetupFromPlayerLevel(data.playerLevel);
			}

			//send data to the renderer
			if (shouldUpdateZoneTracker) {
				mainWindow.webContents.send('zoneUpdatesFromLog', objectFactory.getZoneTracker());
				mainWindow.webContents.send(
					'zoneLayoutImageUpdates',
					objectFactory.getZoneTracker().zoneImageFilePaths
				);
			}

			if (shouldUpdateLevelTracker) {
				mainWindow.webContents.send(
					'subscribeToLevelUpdates',
					objectFactory.getLevelTracker()
				);
			}

			if (shouldUpdateGemTracker) {
				mainWindow.webContents.send(
					'subscribeToGemUpdates',
					{
						allGemSetupLevels: objectFactory.getGemTracker().allGemSetupLevels,
						selectedLevel: objectFactory.getGemTracker().gemSetup.level,
						gemLinks: objectFactory.getGemTracker().gemSetup.gemLinks
					}
				);
			}
		});
	}

	// TODO fix this! Should be storing the path that is actually being watched not hoping that
	// TODO this is up to date when we want to stop watching
	stopWatching() {
		fs.unwatchFile(this.watchedFilePath);
	}

	readNewLines(current: fs.Stats, previous: fs.Stats) {
		//mtime is I think last changed time?
		if (current.mtime <= previous.mtime) {
			return;
		}

		// Figure out size of the buffer
		var newFileSize: number = fs.statSync(objectFactory.getSettingsService().getClientTxtPath()).size;
		var sizeDiff: number = newFileSize - this.previousFileSize;

		//If we get a negative difference, the file was reset, so we read the whole
		// file
		if (sizeDiff < 0) {
			this.previousFileSize = 0;
			sizeDiff = newFileSize;
		}

		var buffer = Buffer.alloc(sizeDiff);

		//read the file and save our place
		var fileDescriptor = fs.openSync(objectFactory.getSettingsService().getClientTxtPath(), 'r');
		fs.readSync(fileDescriptor, buffer, 0, sizeDiff, this.previousFileSize);
		fs.closeSync(fileDescriptor);

		//update the fileSize for the next loop
		this.previousFileSize = newFileSize;

		//read the buffer here
		var data = this.parseBuffer(buffer);

		log.info('New lines had data', data);
		return data;
	}

	parseBuffer(buffer: Buffer) {
		// Set invalid values that we can check against later.
		var playerLevel = 0;
		var monsterLevel = 0;
		var zoneCode = '';

		var newLines = buffer.toString();

		var matches = newLines.match(this.levelUpRegex);
		if (matches) {
			playerLevel = parseInt(matches[1]);
		}

		var matches = newLines.match(this.newZoneRegex);
		if (matches) {
			monsterLevel = parseInt(matches[1]);
			zoneCode = matches[2];
		}

		return { playerLevel, monsterLevel, zoneCode };
	}
}
