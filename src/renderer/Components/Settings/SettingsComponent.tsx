import { useEffect, useState } from 'react';
import { Rnd } from 'react-rnd';
// Import missing components
import { GeneralSettingsComponent } from './GeneralSettingsComponent';
import { GemSettingsComponent } from './GemSettingsComponent';
import { AboutSettingsComponent } from './AboutSettingsComponent';

export function SettingsComponent() {
	const [activePage, setActivePage] = useState<'General' | 'Gems' | 'About'>('General');
	const [isHovered, setIsHovered] = useState(false);
	const [moveMode, setMoveMode] = useState(false);

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
			disableDragging={!moveMode}
			enableResizing={moveMode}
		>
			<div className="SettingsOverlay"
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => { setIsHovered(false); setMoveMode(false); }}
			>
				{/* Banner */}
				<div className="SettingsBanner">
					Settings - Path of Levelling 2
					{/* Hidden Move Button */}
					{isHovered && !moveMode && (
						<div className="SettingsMenu">
							<button onClick={() => setMoveMode(true)}>Move/Resize</button>
						</div>
					)}
					{moveMode && (
						<div className="SettingsMenu">
							<button onClick={() => setMoveMode(false)}>Done</button>
						</div>
					)}
				</div>
				{/* Sidebar*/}
				<div className="SettingsSidebar">
					<button
						className={`SidebarTab${activePage === 'General' ? ' Active' : ''}`}
						onClick={() => setActivePage('General')}
					>
						<h3>General</h3>
					</button>
					<button
						className={`SidebarTab${activePage === 'Gems' ? ' Active' : ''}`}
						onClick={() => setActivePage('Gems')}
					>
						<h3>Gems</h3>
					</button>
					<button
						className={`SidebarTab${activePage === 'About' ? ' Active' : ''}`}
						onClick={() => setActivePage('About')}
					>
						<h3>About</h3>
					</button>
				</div>
				{/* Main Content */}
				<div className="SettingsPageContent">
					{activePage === 'General' && <GeneralSettingsComponent />}
					{activePage === 'Gems' && <GemSettingsComponent />}
					{activePage === 'About' && <AboutSettingsComponent />}
				</div>
			</div>
		</Rnd>
	);
}