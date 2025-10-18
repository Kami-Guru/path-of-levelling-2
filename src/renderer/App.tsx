import React, { useEffect, useState } from "react";
import "./App.css";
import { GemTrackerComponent } from "./Components/GemTrackerComponent";
import { LevelTrackerComponent } from "./Components/LevelTrackerComponent";
import { SettingsComponent } from "./Components/Settings/SettingsComponent";
import { ZoneNotesComponent } from "./Components/ZoneTracker/ZoneNotesComponent";
import { ZoneTrackerComponent } from "./Components/ZoneTracker/ZoneTrackerComponent";

function App() {
	const [settingsActive, setSettingsActive] = useState(false);
	const [zoneNotesActive, setZoneNotesActive] = useState(true);
	const [layoutImagesActive, setLayoutImagesActive] = useState(true);
	const [levelTrackerActive, setLevelTrackerActive] = useState(true);
	const [gemTrackerActive, setGemTrackerActive] = useState(true);

	const [fontSize, setFontSize] = useState(11);

	useEffect(() => {
		window.electron.subscribeToHotkeys((hotkeyEvent) => {
			console.log("Received hotkey event in renderer: ", hotkeyEvent);
			switch (hotkeyEvent.hotkey) {
				case "ToggleSettings":
					setSettingsActive(hotkeyEvent.value);
					break;
				case "ToggleZoneNotes":
					setZoneNotesActive(hotkeyEvent.value);
					break;
				case "ToggleLayoutImages":
					setLayoutImagesActive(hotkeyEvent.value);
					break;
				case "ToggleLevelTracker":
					setLevelTrackerActive(hotkeyEvent.value);
					break;
				case "ToggleGemTracker":
					setGemTrackerActive(hotkeyEvent.value);
					break;
				default:
					console.log("Unrecognised hotkey!", hotkeyEvent.hotkey);
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
		window.electron.getFontScalingFactor().then((fontScale) => {
			setFontSize(Math.ceil(11 * fontScale));
		});
	}, []);

	return (
		<div
			style={{ fontSize: fontSize }}
			className={settingsActive ? "overlay-container-shown" : "overlay-container-hidden"}
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
