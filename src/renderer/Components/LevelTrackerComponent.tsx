import { useEffect, useRef, useState } from 'react';
import { Rnd } from 'react-rnd';
import { LevelDataDto } from '../../main/ipc/apiInterface';

export function LevelTrackerComponent() {
	//TODO need to do a lot of renaming here since this was copied from zone tracker
	//TODO eg there is no dropdown, you can't even input on the level tracker currently
	const [levelDropdown, setLevelDropdown] = useState({
		playerLevel: 0,
		monsterLevel: 0,
		expMulti: 1,
	});

	const setLevelDropdownFromTracker = (levelTracker: LevelDataDto) => {
		setLevelDropdown({
			playerLevel: levelTracker.playerLevel,
			monsterLevel: levelTracker.monsterLevel,
			expMulti: levelTracker.expMulti,
		});
	};

	//Subscribe to the level updates pushed from log tracker
	useEffect(() => {
		window.electron.subscribeToLevelUpdates((levelTracker) => {
			setLevelDropdownFromTracker(levelTracker);
		});
	}, []);

	// Get initial state for level dropdown
	useEffect(() => {
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
	const [moveMode, setMoveMode] = useState(false);
	const [isHovered, setIsHovered] = useState(false);
	const [rndState, setRndState] = useState({
		x: 0,
		y: 0,
		height: '200',
		width: '400',
	});

	// Get initial state for level tracker position
	useEffect(() => {
		window.electron.getLevelOverlayPositionSettings()
			.then((levelOverlayPositionSettings) => {
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

			bounds="parent"
			disableDragging={!moveMode}
			enableResizing={{
				top: false,
				right: moveMode,
				bottom: false,
				left: moveMode,
				topRight: false,
				bottomRight: false,
				bottomLeft: false,
				topLeft: false,
			}}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			resizeHandleComponent={
				moveMode
					? {
						bottomRight: (
							<div className="RndResizeCircleHandle"></div>
						),
					}
					: {}
			}
		>
			{/* Move/Resize button just to the right */}
			{isHovered && !moveMode && (
				<div className="TrackerMoveResizeButtonContainer">
					<button onClick={() => setMoveMode(true)}>Move/Resize</button>
				</div>
			)}
			{moveMode && (
				<div className="TrackerMoveResizeButtonContainer">
					<button onClick={() => setMoveMode(false)}>Done</button>
				</div>
			)}
			<div className="LevelTracker">
				<p>{getDiffLine()}</p>
				<p className="ExpMulti">Exp Multi: {levelDropdown.expMulti.toString()}</p>
			</div>
		</Rnd>
	);
}
