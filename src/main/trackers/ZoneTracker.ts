import log from 'electron-log';
import fs from 'fs';
import path from 'path';
import { getBuildPath, getZoneLayoutImagesAbsolutePath, getZoneNotesPath, getZoneReferenceDataPath } from '../pathResolver.js';
import { objectFactory } from '../objectFactory.js';
import { StoreService } from '../services/StoreService.js';
import { getProfile } from '../profiles/profiles.js';
import { ZoneReferenceData } from '../zodSchemas/schemas.js';

export class ZoneTracker {
	act: string = "Act 1";
	zoneName: string = "The Riverwood";
	zoneCode: string = "G1_1";

	// Used to populate the dropdowns in UI
	allActs: string[] = [''];
	allZonesInAct: string[] = [''];

	// Used to populate zone layout images
	zoneImageFilePaths: string[] = [''];
	zoneReferenceData: ZoneCodeToZoneReference = Object();

	// Guide
	actNotes: string = '';
	zoneNotes: string = '';

	allZoneNotesPath: string = '';
	allZoneNotes: JSON = Object();

	constructor(storeService: StoreService) {
		this.zoneReferenceData = JSON.parse(fs.readFileSync(
			getZoneReferenceDataPath(getProfile().Id), 'utf-8'));

		// ...new Set() removes duplicates
		this.allActs = [
			...new Set(Object.values(this.zoneReferenceData).map((zoneReference) => zoneReference.act))
		];

		var zoneNotesPath = getZoneNotesPath(getProfile().Id);

		try {
			log.info('Loading zone notes from path:', zoneNotesPath)
			this.loadAllZoneNotes(zoneNotesPath);
			this.saveZoneFromCode(
				storeService.getGameSetting('lastSessionState.zoneCode'),
				true
			);
		} catch (error) {
			log.error('Could not construct ZoneTracker, with error:')
			log.error(error)
		}
	}

	init() { }

	loadAllZoneNotes(allZoneNotesPath: string) {
		log.info('Trying to load zone notes at path', allZoneNotesPath);

		this.allZoneNotesPath = allZoneNotesPath;

		try {
			var buffer = fs.readFileSync(this.allZoneNotesPath);
			this.allZoneNotes = JSON.parse(buffer.toString());
			log.info('Successfully loaded zone notes');
		}
		catch (error) {
			log.info('Could not load zone notes');
		}
	}

	// This is called when someone selects an act in the dropdown in the UI
	// We basically need to switch to that act, then set everything based on the first zone
	// in that act as a default.
	saveZoneFromActName(actName: string) {
		// returns the first [key, value] pair for the act, which should give the first zone.
		const zoneCodeToZoneReference = Object.entries(this.zoneReferenceData).find(([key, value]) => value.act === actName);
		if (zoneCodeToZoneReference == null) {
			return false;
		}

		this.act = actName;
		this.zoneName = zoneCodeToZoneReference[1].zoneName;
		this.zoneCode = zoneCodeToZoneReference[0];

		this.allZonesInAct = Object.entries(this.zoneReferenceData)
			.filter(([key, value]) => value.act === this.act)
			.map(([key, value]) => value.zoneName);

		this.setZoneNotes();

		this.setZoneLayoutImagePaths(this.zoneCode);

		objectFactory.getStateTracker().saveSessionState();
	}

	// This is called when someone selects a zone in the dropdown in the UI
	// In this case the act + name is enough to get the exact zone they want.
	saveZoneFromZoneNameAndActName(zoneName: string, actName: string) {
		// returns the first [key, value] pair for the act, which should give the first zone.
		const zoneCodeToZoneReference = Object.entries(this.zoneReferenceData)
			.find(([key, value]) => value.act === actName && value.zoneName === zoneName);
		if (zoneCodeToZoneReference == null) {
			return false;
		}

		this.act = actName;
		this.zoneName = zoneCodeToZoneReference[1].zoneName;
		this.zoneCode = zoneCodeToZoneReference[0];

		this.allZonesInAct = Object.entries(this.zoneReferenceData)
			.filter(([key, value]) => value.act === this.act)
			.map(([key, value]) => value.zoneName);

		this.setZoneNotes();

		this.setZoneLayoutImagePaths(this.zoneCode);

		objectFactory.getStateTracker().saveSessionState();
	}

	// This method takes a zoneCode and uses it to update the current state
	// Returns a boolean representing whether or not there was actually a change in zone
	// !If a zone is not found with that code we just do nothing!
	saveZoneFromCode(zoneCode: string, updateOnly: boolean = false): boolean {
		var zoneChanged: boolean = this.setZoneFromCode(zoneCode);

		if (!zoneChanged) return false;

		this.setZoneNotes();

		this.setZoneLayoutImagePaths(this.zoneCode);

		// There are a few reasons we want to update locally, but not save.
		// Biggest example is when the app is first starting up and loading from file,
		// don't need to immediately write to that file.
		if (!updateOnly) objectFactory.getStateTracker().saveSessionState();

		return true;
	}

	setZoneFromCode(zoneCode: string): boolean {
		const zoneReference: ZoneReference = this.zoneReferenceData[zoneCode];

		if (zoneReference == undefined) {
			return false;
		}

		this.act = zoneReference.act;
		this.zoneName = zoneReference.zoneName;
		this.zoneCode = zoneCode;

		this.allZonesInAct = Object.entries(this.zoneReferenceData)
			.filter(([key, value]) => value.act === this.act)
			.map(([key, value]) => value.zoneName);

		return true;
	}

	setZoneNotes() {
		//@ts-ignore
		var actNotes = this.allZoneNotes.actNotes.find((actNotes) => {
			return actNotes.act == this.act;
		});

		if (actNotes == null) { return; }

		this.actNotes = actNotes.notes;

		//@ts-ignore
		var zoneNotes = this.allZoneNotes.zoneNotes.find((zoneNotes) => {
			return zoneNotes.code == this.zoneCode;
		});

		// This basically gives users the option to not set notes for a zone
		// Dont know why they would but as a side effect missing notes don't cause error
		// popups.
		if (zoneNotes == null) { return; }

		this.zoneNotes = zoneNotes.notes;
	}

	// Returns a boolean representing whether or not zone layout image paths were changed.
	// Stops us from updating images every time this method is called. 
	//TODO actually I never use this bool, is it really necessary? there are already
	//TODO safeguards to prevent zone ntoes from being changed when zone isn't really
	//TODO changed, but am I ok with these being so coupled? I guess it isn't really coupling
	//TODO if it's all the same state on the same class. 
	setZoneLayoutImagePaths(zoneCode: string): Boolean {
		log.info('Trying to get zone image paths for zone code', zoneCode)
		const directories = fs.readdirSync(getZoneLayoutImagesAbsolutePath());

		// Note we HAVE to use find since G1_1 also matches G1_15
		const requiredDirectory = directories.find((directory) => {
			return directory.includes(zoneCode);
		})

		// If we couldn't find layout images, clear the file paths (i.e. clear the layout images).
		// This is useful for towns, or for areas that don't have layout images.
		if (requiredDirectory == null) {
			this.zoneImageFilePaths = [];
			return false;
		};

		const fileNames = fs.readdirSync(path.join(getZoneLayoutImagesAbsolutePath(), requiredDirectory));

		if (fileNames == null || fileNames.length == 0) {
			this.zoneImageFilePaths = [];
			return false;
		}

		var filePaths = fileNames.map((fileName: string) => {
			//TODO: I have to find a better way to store this ../ stuff, this needs to 
			//TODO: send RELATIVE filepaths, and that is FROM LayoutImageComponent.tsx :(
			return path.join('Layout Images', requiredDirectory, fileName)
		})

		this.zoneImageFilePaths = filePaths;
		log.info('Found zone image paths', this.zoneImageFilePaths)
		return true;
	}
}
