import React, { useEffect, useState } from 'react';
import './App.css';
import { GemTrackerComponent } from './Components/GemTrackerComponent';
import { LevelTrackerComponent } from './Components/LevelTrackerComponent';
import { SettingsComponent } from './Components/Settings/SettingsComponent';
import { ZoneNotesComponent } from './Components/ZoneTracker/ZoneNotesComponent';
import { ZoneTrackerComponent } from './Components/ZoneTracker/ZoneTrackerComponent';

function App() {
	const [settingsActive, setSettingsActive] = useState(false);
	const [zoneNotesActive, setZoneNotesActive] = useState(true);
	const [layoutImagesActive, setLayoutImagesActive] = useState(true);
	const [levelTrackerActive, setLevelTrackerActive] = useState(true);
	const [gemTrackerActive, setGemTrackerActive] = useState(true);

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
			if (hotkeyEvent.Hotkey == 'ToggleGemTracker') {
				setGemTrackerActive(hotkeyEvent.value);
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
			{/* Zone tracker component set up a little different becuase zone & layout are coupled */}
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
