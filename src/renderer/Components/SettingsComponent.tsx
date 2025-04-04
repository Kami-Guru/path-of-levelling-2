import { ChangeEventHandler, useEffect, useRef, useState } from 'react';
import { DraggableData, Rnd } from 'react-rnd';

export function SettingsComponent() {
	// Setting up the input forms
	const [clientPath, setClientPath] = useState('');
	const [isClientPathSaveClicked, setIsClientPathSaveClicked] = useState(false);
	const [isClientWatcherActive, setIsClientWatcherActive] = useState(Boolean);

	// This basically just records keystrokes in the input component so that the text
	// is actually stored.
	const handleClientPathChange = (event: any) => {
		setClientPath(event.target.value);
	};

	// Get initial state - this is required for the input to show the current client path.
	useEffect(() => {
		//@ts-ignore
		window.electron.getClientPath().then((clientPath: string) => {
			setClientPath(clientPath);
		});
	}, []);

	// Post the clientPath provided by the user and get a bool saying whether or not the
	// log watcher was activated.
	const handleSaveClientPathClicked = (event: any) => {
		//@ts-ignore
		window.electron.saveClientPath(clientPath).then((isWatcherActive: boolean) => {
			setIsClientWatcherActive(isWatcherActive);
			setIsClientPathSaveClicked(true);
		});
	};

	// Get initial state for whether or not the client log reader was attached.
	useEffect(() => {
		//@ts-ignore
		window.electron
			.getIsClientWatcherActive()
			.then((isClientWatcherActive: boolean) => {
				setIsClientWatcherActive(isClientWatcherActive);
			});
	}, []);

	const getClientPathSaveButtonText = () => {
		if (isClientPathSaveClicked) {
			return 'Saved!';
		}
		return 'Save';
	};

	const conditionalDisplayClientWatcherWarning = () => {
		if (isClientWatcherActive) {
			return;
		}

		return (
			<p className="ClientWatcherNotActiveWarning">
				Cannot access Path Of Exile 2 logs! Please update your path!
			</p>
		);
	};

	// Setting up the draggable/resizable state
	const [rndState, setRndState] = useState({
		x: 0,
		y: 0,
		height: '200',
		width: '400',
	});

	// Get initial state for settings window position
	useEffect(() => {
		//@ts-ignore
		window.electron
			.getSettingsOverlayPositionSettings()
			.then((settingsOverlayPositionSettings: any) => {
				setRndState({
					x: settingsOverlayPositionSettings.x,
					y: settingsOverlayPositionSettings.y,
					height: settingsOverlayPositionSettings.height,
					width: settingsOverlayPositionSettings.width,
				});
			});
	}, []);

	const handleDrag = (e: any, d: any) => {
		// Send new settings to client to be saved
		//@ts-ignore
		window.electron.saveSettingsOverlayPositionSettings({
			...rndState,
			x: d.x,
			y: d.y,
		});

		setRndState({
			...rndState,
			x: d.x,
			y: d.y,
		});
	};

	// @ts-ignore
	const handleResize = (e, direction, ref, delta, position) => {
		// Send new settings to client to be saved
		//@ts-ignore
		window.electron.saveSettingsOverlayPositionSettings({
			...position,
			height: ref.style.height,
			width: ref.style.width,
		});

		setRndState({
			...position,
			height: ref.style.height,
			width: ref.style.width,
		});
	};

	return (
		<Rnd
			size={{ width: rndState.width, height: rndState.height }}
			position={{ x: rndState.x, y: rndState.y }}
			onDragStop={(e, d) => handleDrag(e, d)}
			onResizeStop={(e, direction, ref, delta, position) =>
				handleResize(e, direction, ref, delta, position)
			}
			style={{ backgroundColor: 'rgba(50, 50, 50, 0.7)' }}
			bounds="parent"
		>
			<div className="SettingsOverlay">
				<div className="HotkeysWrapper">
					<h2>Hotkeys</h2>
					<div className="HotkeysRow">
						<p>Show/hide settings: Ctrl+Alt+s</p>
						<p>Show/hide zone notes: Ctrl+Alt+z</p>
						<p>Show/hide layout images: Ctrl+Alt+i</p>
						<p>Show/hide level tracker: Ctrl+Alt+l</p>
					</div>
				</div>
				<div className="ClientPathUpdaterWrapper">
					<h2>Enter your Client.txt Path here</h2>
					<div>
						<p style={{ marginBottom: '0' }}>
							Required for automatic updating. Path should look like this:
						</p>
						<p style={{ marginTop: '0' }}>
							C:/SteamLibrary/steamapps/common/Path of Exile
							2/logs/Client.txt
						</p>
						{conditionalDisplayClientWatcherWarning()}
						<label className="SettingsLabel">
							Path:
							<input
								autoComplete={clientPath}
								className="ClientPathInput"
								name="clientPath"
								value={clientPath}
								onChange={(e) => {
									handleClientPathChange(e);
								}}
							/>
							<button
								className="SaveClientPathSettingsButton"
								title="saveClientPath"
								onClick={handleSaveClientPathClicked}
							>
								{getClientPathSaveButtonText()}
							</button>
						</label>
					</div>
				</div>
			</div>
		</Rnd>
	);
}
