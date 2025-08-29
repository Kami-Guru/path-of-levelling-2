import { useEffect, useRef, useState } from 'react';
import { Rnd } from 'react-rnd';

export function ZoneNotesComponent(props: {
	sharedZoneCode: string;
	setSharedZoneCode: any;
}) {
	// Create state for zone dropdown
	const [zoneDropdown, setZoneDropdown] = useState({
		actNameSelected: '',
		zoneNameSelected: '',
		allActNames: [''],
		allZoneNames: [''],
		currentActNotes: '',
		currentZoneNotes: '',
	});

	const setZoneDropdownFromTracker = (zoneTracker: any) => {
		setZoneDropdown({
			actNameSelected: zoneTracker.act,
			zoneNameSelected: zoneTracker.zone,
			allActNames: zoneTracker.allActs,
			allZoneNames: zoneTracker.allZonesInAct,
			currentActNotes: zoneTracker.actNotes,
			currentZoneNotes: zoneTracker.zoneNotes,
		});
	};

	//Subscribe to the zone updates pushed from log tracker
	useEffect(() => {
		//@ts-ignore
		window.electron.subscribeToZoneNotesUpdates((zoneTracker) => {
			props.setSharedZoneCode(zoneTracker.zoneCode);

			setZoneDropdownFromTracker(zoneTracker);
		});
	}, []);

	// Get initial state for zone dropdown
	useEffect(() => {
		//@ts-ignore
		window.electron.getZoneState().then((zoneTracker) => {
			props.setSharedZoneCode(zoneTracker.zoneCode);

			setZoneDropdownFromTracker(zoneTracker);
		});
	}, []);

	// Handle user updates to zone dropdown
	const handleZoneDropdownSelection = (event: React.ChangeEvent<HTMLSelectElement>) => {
		// Post the change to main process and await
		if (event.target.name == 'actNameSelected') {
			//@ts-ignore
			window.electron.postActSelected(event.target.value).then((zoneTracker) => {
				props.setSharedZoneCode(zoneTracker.zoneCode);
				setZoneDropdownFromTracker(zoneTracker);
			});
		} else if (event.target.name == 'zoneNameSelected') {
			//@ts-ignore
			window.electron
				.postZoneSelected(event.target.value, zoneDropdown.actNameSelected)
				.then((zoneTracker: any) => {
					props.setSharedZoneCode(zoneTracker.zoneCode);
					setZoneDropdownFromTracker(zoneTracker);
				});
		}

		// Update the dropdown selection
		setZoneDropdown({
			...zoneDropdown,
			[event.target.name]: event.target.value,
		});
	};

	// Setting up the draggable/resizable state
	const [moveMode, setMoveMode] = useState(false);
	const [isHovered, setIsHovered] = useState(false);
	const [rndState, setRndState] = useState({
		x: 0,
		y: 0,
		height: '200',
		width: '400',
	});

	// Get initial state for zone tracker position
	useEffect(() => {
		//@ts-ignore
		window.electron
			.getZoneOverlayPositionSettings()
			.then((zoneOverlayPositionSettings: any) => {
				setRndState({
					x: zoneOverlayPositionSettings.x,
					y: zoneOverlayPositionSettings.y,
					height: zoneOverlayPositionSettings.height,
					width: zoneOverlayPositionSettings.width,
				});
			});
	}, []);

	const handleDrag = (e: any, d: any) => {
		// Send new settings to client to be saved
		//@ts-ignore
		window.electron.saveZoneOverlayPositionSettings({
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
		window.electron.saveZoneOverlayPositionSettings({
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
			<div className="ZoneNotes">
				<select
					className="ZoneDropdown"
					name="actNameSelected"
					value={zoneDropdown.actNameSelected}
					//defaultValue={ allActs[0] }
					onChange={(act) => {
						handleZoneDropdownSelection(act);
					}}
				>
					{zoneDropdown.allActNames.map(function (act: any) {
						return (
							<option
								value={act}
								selected={act == zoneDropdown.actNameSelected}
							>
								{act}
							</option>
						);
					})}
				</select>
				<p className="ZoneOrActNotes">{zoneDropdown.currentActNotes}</p>
				<select
					className="ZoneDropdown"
					name="zoneNameSelected"
					value={zoneDropdown.zoneNameSelected}
					//defaultValue={ allzones[0] }
					onChange={(zone) => {
						handleZoneDropdownSelection(zone);
					}}
				>
					{zoneDropdown.allZoneNames.map(function (zone: any) {
						return (
							<option
								className="dropdownOption"
								value={zone}
								selected={zone == zoneDropdown.zoneNameSelected}
							>
								{zone}
							</option>
						);
					})}
				</select>
				<p className="ZoneOrActNotes">{zoneDropdown.currentZoneNotes}</p>
			</div>
		</Rnd>
	);
}
