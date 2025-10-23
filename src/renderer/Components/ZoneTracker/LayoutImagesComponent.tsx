import { useEffect, useState } from 'react';
import { Rnd } from 'react-rnd';

export function LayoutImagesComponent(props: { sharedZoneCode: any }) {
	const [filePaths, setFilePaths] = useState(['']);

	// Get initial state - this is required for layout images to appear when the component
	// is re-rendered by itself (eg with the show/hide hotkey)
	useEffect(() => {
		window.electron.getLayoutImagePaths().then((layoutImageFilePaths) => {
			setFilePaths(layoutImageFilePaths);
		});
	}, []);

	// Listen to updates from main. Users can't do anything in this component to change
	// zone so the quick and dirty implementation for layout images is literally just
	// add a subscription to zone notes and whenever zone notes is updated I will also
	// send a message to this subscription from main.
	useEffect(() => {
		window.electron.subscribeToZoneLayoutImageUpdates((zoneImageFilePaths) => {
			setFilePaths(zoneImageFilePaths);
		});
	}, []);

	// Setting up the deggable/resizable state
	const [moveMode, setMoveMode] = useState(false);
	const [isHovered, setIsHovered] = useState(false);
	const [rndState, setRndState] = useState({
		x: 0,
		y: 0,
		height: '200',
		width: '400',
	});

	// Get initial state for layout images position
	useEffect(() => {
		window.electron.getLayoutImagesOverlayPositionSettings().then((layoutImagesOverlayPositionSettings) => {
			setRndState({
				x: layoutImagesOverlayPositionSettings.x,
				y: layoutImagesOverlayPositionSettings.y,
				height: layoutImagesOverlayPositionSettings.height,
				width: layoutImagesOverlayPositionSettings.width,
			});
		});
	}, []);

	const handleDrag = (e: any, d: any) => {
		// Send new settings to client to be saved
		window.electron.saveLayoutImagesOverlayPositionSettings({
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
		window.electron.saveLayoutImagesOverlayPositionSettings({
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
			<div className="LayoutImages">
				{filePaths.map(function (filePath: string) {
					if (filePath != '') {
						return (
							<div className="LayoutImageContainer">
								<img
									className="LayoutImage"
									src={filePath}
									draggable={false}
								/>
							</div>
						);
					}
				})}
			</div>
		</Rnd>
	);
}
