import { useEffect, useRef, useState } from 'react';
import { Rnd } from 'react-rnd';

export function LevelTrackerComponent() {
	//TODO need to do a lot of renaming here since this was copied from zone tracker
	//TODO eg there is no dropdown, you can't even input on the level tracker currently
	const [levelDropdown, setLevelDropdown] = useState({
		playerLevel: Number,
		monsterLevel: Number,
		expMulti: Number,
	});

	const setLevelDropdownFromTracker = (levelTracker: any) => {
		setLevelDropdown({
			playerLevel: levelTracker.playerLevel,
			monsterLevel: levelTracker.monsterLevel,
			expMulti: levelTracker.expMulti,
		});
	};

	//Subscribe to the level updates pushed from log tracker
	useEffect(() => {
		//@ts-ignore
		window.electron.subscribeToLevelUpdates((levelTracker) => {
			setLevelDropdownFromTracker(levelTracker);
		});
	}, []);

	// Get initial state for level dropdown
	useEffect(() => {
		//@ts-ignore
		window.electron.getLevelState().then((levelTracker) => {
			setLevelDropdownFromTracker(levelTracker);
		});
	}, []);

	function getDiffLine() {
		// @ts-ignore
		var diff = levelDropdown.playerLevel - levelDropdown.monsterLevel;

		return 'Level Diff: ' + (diff < 0 ? '' : '+') + diff.toString();
	}

	// Setting up the deggable/resizable state
	const [rndState, setRndState] = useState({
		x: 0,
		y: 0,
		height: '200',
		width: '400',
	});

	// Get initial state for level tracker position
	useEffect(() => {
		//@ts-ignore
		window.electron
			.getLevelOverlayPositionSettings()
			.then((levelOverlayPositionSettings: any) => {
				setRndState({
					x: levelOverlayPositionSettings.x,
					y: levelOverlayPositionSettings.y,
					height: levelOverlayPositionSettings.height,
					width: levelOverlayPositionSettings.width,
				});
			});
	}, []);

	const handleDrag = (e: any, d: any) => {
		// Send new settings to client to be saved
		//@ts-ignore
		window.electron.saveLevelOverlayPositionSettings({
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
		window.electron.saveLevelOverlayPositionSettings({
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
			enableResizing={{
				top: false,
				right: true,
				bottom: false,
				left: true,
				topRight: false,
				bottomRight: false,
				bottomLeft: false,
				topLeft: false,
			}}
			bounds="parent"
		>
			<div className="LevelTracker">
				<p>{getDiffLine()}</p>
				<p className="ExpMulti">Exp Multi: {levelDropdown.expMulti.toString()}</p>
			</div>
		</Rnd>
	);
}
