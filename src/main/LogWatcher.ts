import { BrowserWindow } from 'electron';
import log from 'electron-log';
import fs from 'fs';

export class LogWatcher {
	newZoneRegex: RegExp;
	levelUpRegex: RegExp;
	previousFileSize: number;

	constructor() {
		this.newZoneRegex = RegExp('Generating level (.*) area "(.*)" with seed');
		this.levelUpRegex = RegExp('is now level (.*)');

		this.previousFileSize = 0;
	}

	// The fs.watchFile is the watcher that gets changes from client.txt
	watchClientTxt(mainWindow: BrowserWindow) {
		log.info('Trying to subscribe to Client.txt');
		try {
			this.previousFileSize = fs.statSync(settings.getClientTxtPath()).size;
		} catch (e: any) {
			// This flag basically displays a warning on the UI telling the user to
			// update their client txt path.
			mainState.logWatcherActive = false;

			if ((e.code = 'ENOENT')) {
				//@ts-ignore
				log.info(
					'ERROR: Could not subscribe to client txt changes, wrong client path!'
				);
				return;
			}

			log.info(
				'ERROR: Could not subscribe to client txt changes, unknown error',
				e
			);
			return;
		}

		mainState.logWatcherActive = true;
		log.info('Successfully subscribed to Client.txt');

		fs.watchFile(settings.getClientTxtPath(), (current, previous) => {
			var data = this.readNewLines(current, previous);

			if (data == null) {
				return;
			}

			var shouldUpdateZoneTracker = false;
			// handle new zone code
			if (data.zoneCode != '') {
				shouldUpdateZoneTracker = mainState.ZoneTracker.saveZoneFromCode(
					data.zoneCode
				);
			}

			var shouldUpdateLevelTracker;
			if (data.monsterLevel > 0 || data.playerLevel > 0) {
				shouldUpdateLevelTracker = true;
				mainState.LevelTracker.savePlayerOrMonsterLevel(
					data.playerLevel,
					data.monsterLevel
				);
			}

			var shouldUpdateGemTracker;
			if (data.playerLevel > 0) {
				shouldUpdateGemTracker = true;
				mainState.GemTracker.setGemSetupFromPlayerLevel(data.playerLevel);
			}

			//send data to the renderer
			if (shouldUpdateZoneTracker) {
				mainWindow.webContents.send('zoneUpdatesFromLog', mainState.ZoneTracker);
				mainWindow.webContents.send(
					'zoneLayoutImageUpdates',
					mainState.ZoneTracker.zoneImageFilePaths
				);
			}

			if (shouldUpdateLevelTracker) {
				mainWindow.webContents.send(
					'subscribeToLevelUpdates',
					mainState.LevelTracker
				);
			}

			if (shouldUpdateGemTracker) {
				mainWindow.webContents.send(
					'subscribeToGemUpdates',
					{
						allGemSetupLevels: mainState.GemTracker.allGemSetupLevels,
						selectedLevel: mainState.GemTracker.gemSetup.level,
						gemLinks: mainState.GemTracker.gemSetup.gemLinks
					}
				);
			}
		});
	}

	readNewLines(current: fs.Stats, previous: fs.Stats) {
		//mtime is I think last changed time?
		if (current.mtime <= previous.mtime) {
			return;
		}

		// Figure out size of the buffer
		var newFileSize: number = fs.statSync(settings.getClientTxtPath()).size;
		var sizeDiff: number = newFileSize - this.previousFileSize;

		//If we get a negative difference, the file was reset, so we read the whole
		// file
		if (sizeDiff < 0) {
			this.previousFileSize = 0;
			sizeDiff = newFileSize;
		}

		var buffer = Buffer.alloc(sizeDiff);

		//read the file and save our place
		var fileDescriptor = fs.openSync(settings.getClientTxtPath(), 'r');
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

	stopTracking() {
		fs.unwatchFile(settings.getClientTxtPath());
	}
}
