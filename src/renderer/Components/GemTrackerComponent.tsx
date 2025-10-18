import { useEffect, useState } from 'react';
import { DraggableData, Rnd } from 'react-rnd';
import { GemDataDto } from '../../main/ipc/apiInterface';

export function GemTrackerComponent() {
	const [gemDropdown, setGemDropdown] = useState({
		selectedLevel: 0,
		gemLinks: [''],
		allGemSetupLevels: [0],
	});

	const setGemDropdownFromClientResponse = (response: GemDataDto) => {
		setGemDropdown({
			allGemSetupLevels: response.allGemSetupLevels,
			selectedLevel: response.gemSetupLevel,
			gemLinks: response.gemLinks,
		});
	};

	// Subscribe to the gem updates pushed from main
	useEffect(() => {
		window.electron.subscribeToGemUpdates((reponse) => {
			setGemDropdownFromClientResponse(reponse);
		});
	}, []);

	// Get initial state for gem dropdown
	useEffect(() => {
		window.electron.getGemState().then((reponse) => {
			setGemDropdownFromClientResponse(reponse);
		});
	}, []);

	// Handle user updates to gem dropdown
	const handleGemDropdownSelection = (event: React.ChangeEvent<HTMLSelectElement>) => {
		const level = Number(event.target.value);

		if (isNaN(level)) {
			console.log("Selected level is not  anumber! Was:", event.target.value);
			return;
		}

		// Post the change to main process and await
		window.electron.postGemLevelSelected(level).then((reponse) => {
			setGemDropdownFromClientResponse(reponse);
		});
	};

	const getGemLevelDisplayString = (gemSetupLevel: any, index: number) => {
		if (index == gemDropdown.allGemSetupLevels.length - 1) {
			return 'Level: ' + gemSetupLevel.toString() + '+';
		} else {
			return (
				'Level: ' +
				gemSetupLevel.toString() +
				' to ' +
				gemDropdown.allGemSetupLevels[index + 1].toString()
			);
		}
	};

	//#region Draggable/Resizable
	// Setting up the draggable/resizable state
	const [moveMode, setMoveMode] = useState(false);
	const [isHovered, setIsHovered] = useState(false);
	const [rndState, setRndState] = useState({
		x: 0,
		y: 0,
		height: '200',
		width: '400',
	});

	// Get initial state for gem tracker position
	useEffect(() => {
		window.electron.getGemOverlayPositionSettings()
			.then((gemOverlayPositionSettings) => {
				setRndState({
					x: gemOverlayPositionSettings.x,
					y: gemOverlayPositionSettings.y,
					height: gemOverlayPositionSettings.height,
					width: gemOverlayPositionSettings.width,
				});
			});
	}, []);

	const handleDrag = (e: any, d: any) => {
		// Send new settings to client to be saved
		window.electron.saveGemOverlayPositionSettings({
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
		window.electron.saveGemOverlayPositionSettings({
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
	//#endregion

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
			enableResizing={moveMode}
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
			<div className="GemTracker">
				<select
					className="GemDropdown"
					name="gemLevelSelected"
					value={gemDropdown.selectedLevel}
					onChange={(gemSetupLevel) => {
						handleGemDropdownSelection(gemSetupLevel);
					}}
				>
					{gemDropdown.allGemSetupLevels.map(function (
						gemSetupLevel: any,
						index: number
					) {
						return (
							<option
								value={gemSetupLevel}
								selected={
									gemSetupLevel == gemDropdown.selectedLevel
								}
							>
								{getGemLevelDisplayString(gemSetupLevel, index)}
							</option>
						);
					})}
				</select>
				<div className="GemLinksDiv">
					{gemDropdown.gemLinks?.map(function (gemLink: string) {
						return <p className="GemLinks">{gemLink}</p>;
					})}
					<p className="GemLinks"> </p>
					{/*  TODO: This is a newline basically, I proooobably shouldn't be doing this lol */}
				</div>
				{/* <div className="GemSourcesDiv">
					{gemDropdown.gemSources?.map(function (gemSource: string) {
						return <p className="GemSources">{gemSource}</p>;
					})}
				</div> */}
			</div>
		</Rnd>

	);
}
