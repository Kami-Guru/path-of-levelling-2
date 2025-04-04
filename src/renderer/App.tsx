import React, { useEffect, useState } from 'react';
import './App.css';
import { GemTrackerComponent } from './Components/GemTrackerComponent';
import { LevelTrackerComponent } from './Components/LevelTrackerComponent';
import { SettingsComponent } from './Components/SettingsComponent';
import { ZoneNotesComponent } from './Components/ZoneTracker/ZoneNotesComponent';
import { ZoneTrackerComponent } from './Components/ZoneTracker/ZoneTrackerComponent';

function App() {
	const [settingsActive, setSettingsActive] = useState(false);
	const [zoneNotesActive, setZoneNotesActive] = useState(true);
	const [layoutImagesActive, setLayoutImagesActive] = useState(true);
	const [levelTrackerActive, setLevelTrackerActive] = useState(true);
	//NOT IMPLEMENTED SO ALWAYS FALSE
	const [gemTrackerActive, setGemTrackerActive] = useState(false);

	const [fontSize, setFontSize] = useState(11);

	useEffect(() => {
		//@ts-ignore
		window.electron.subscribeToHotkeys((hotkeyEvent: any) => {
			if (hotkeyEvent.Hotkey == 'ToggleSettings') {
				setSettingsActive(hotkeyEvent.value);
			}
			if (hotkeyEvent.Hotkey == 'ToggleZoneNotes') {
				setZoneNotesActive(hotkeyEvent.value);
			}
			if (hotkeyEvent.Hotkey == 'ToggleLayoutImages') {
				setLayoutImagesActive(hotkeyEvent.value);
			}
			if (hotkeyEvent.Hotkey == 'ToggleLevelTracker') {
				setLevelTrackerActive(hotkeyEvent.value);
			}
		});
	}, []);

	const conditionalRenderSettings = () => {
		if (settingsActive) {
			return <SettingsComponent />;
		}
	};
	const conditionalRenderLevelTracker = () => {
		if (levelTrackerActive) {
			return <LevelTrackerComponent />;
		}
	};
	const conditionalRenderGemTracker = () => {
		if (gemTrackerActive) {
			return <GemTrackerComponent />;
		}
	};

	useEffect(() => {
		//@ts-ignore
		window.electron.getFontScalingFactor().then((fontScale: any) => {
			console.log('got font scale', fontScale)
			setFontSize(Math.ceil(11 * fontScale));
		});
	}, []);

	return (
		<div
			style={{ fontSize: fontSize }}
			className={
				settingsActive ? 'overlay-container-shown' : 'overlay-container-hidden'
			}
		>
			{conditionalRenderSettings()}
			<ZoneTrackerComponent
				zoneNotesActive={zoneNotesActive}
				layoutImagesActive={layoutImagesActive}
			/>
			{conditionalRenderLevelTracker()}
			{conditionalRenderGemTracker()}
		</div>
	);
}

export default App;
